import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { get_project } from '../database';
import { Request, Response } from 'express';
import { read_until, spawn_and_read } from '../util';

export default async function load(req: Request, res: Response) {
    const short_name = req.query.short_name as string;
    if (!short_name) {
        res.status(400).send('No short_name provided');
        return;
    }

    const project = get_project(short_name);
    if (!project) {
        res.status(400).send(`${short_name} does not exist (it could have expired)`);
        return;
    }

    let binary_bytes;
    try {
        binary_bytes = await fs.readFile(project.file_path);
    }
    catch (ex) {
        res.status(400).send(`${short_name} does not exist (it could have expired)`);
        return;
    }

    try {
        const info: Info = {
            project_name: project.project_name,
            binary: {
                size: binary_bytes.length,
                md5: createHash('md5').update(binary_bytes).digest('hex'),
                sha1: createHash('sha1').update(binary_bytes).digest('hex'),
                desc: [], // set by file_complete
                name: project.project_name,
                malware: false,
                benign: true,
                text: '', // if we have raw data
                options: { // set by raw_data
                    architecture: '',
                    endian: '',
                    selected_opts: []
                },
                base_address: 0, // set by either readelf_complete or readpe_complete
            },
            endians: [], // arm: ['LE', 'BE'], x86: ['x86', 'x64']
            displayUnits: {
                size: 0 // set in /disassemble/
            },
            architectures: [
                'armv7', 'x86'
            ],
            live_mode: project.raw,
            labels: [],
            comments: [],
            branches: [],
            default_permission_level: 'read',
            strings: [],

            // set by the promises below
            symbols: [],
            functions: [],
            sections: []
        };

        info.binary.desc = await file(project.file_path);

        const tasks = [];
        if (project.raw) {
            info.binary.text = Array.from([...binary_bytes]).map(x => x.toString(16).padStart(2, '0')).join(' ');
            info.binary.options.architecture = project.arch;
            info.binary.options.endian = project.mode;

            if (project.arch == 'ARM') {
                info.endians.push('LE', 'BE');
            } else if (project.arch === 'x86') {
                info.endians.push('x86', 'x64');
            }
        }

        if (info.binary.desc.some(x => x.indexOf('ELF') !== -1)) {
            // sections, base_address
            tasks.push(readelf(project.file_path).then(({ sections, base_address }) => {
                info.sections = sections;
                info.binary.base_address = base_address;
            }));

            // symbols, functions
            tasks.push(nm(project.file_path).then(({ symbols, functions }) => {
                info.symbols = symbols;
                info.functions = functions;
            }));
        } else if (info.binary.desc.some(x => x.indexOf('PE32') !== -1)) {
            tasks.push(objdump(project.file_path).then(({ sections, base_address }) => {
                info.sections = sections;
                info.binary.base_address = base_address;
            }));
        } else {
            // raw data

            // sections
            info.sections.push({
                name: 'data',
                vma: 0,
                size: binary_bytes.length,
                flags: [get_section_flag('A') as SectionFlag]
            });
        }

        await Promise.all(tasks);

        // add sections to symbols if there's nothing at that address
        for (const { name, vma, flags } of info.sections) {
            if (!flags.some(flag => flag.abbrev === 'ALLOC'))
                continue;

            if (!info.symbols.some(symbol => symbol.vma === vma)) {
                info.symbols.push({
                    name,
                    vma,
                    type: 'r'
                });
            }
        }

        res.status(200).json(
            info
        );
    }
    catch (ex) {
        console.error(`An error occured while trying to load a binary.\n${ex}`);
        res.status(400).send('An error occured while trying to load the binary.');
    }
}

async function nm(file_path: string): Promise<{ symbols: BinarySymbol[], functions: BinaryFunction[] }> {
    const symbols: BinarySymbol[] = [];
    const functions: BinaryFunction[] = [];

    const output = await spawn_and_read('nm', ['-Cn', '--synthetic', file_path]); // C: demangle, n: numeric sort
    const lines = output.split('\n');
    for (const line of lines) {
        if (line.length === 0) {
            continue;
        }

        const parts = line.split(' ');
        if (parts.length !== 3) {
            // true if the symbol doesn't have an address attached to it, i.e., GLIBC version
            continue;
        }

        const [hex_address, type, symbol] = parts;
        // convert hex string address to integer
        const address = Number.parseInt(hex_address, 16);
        symbols.push({
            name: symbol,
            vma: address,
            type,
        });

        if (type.toLocaleLowerCase() === 't') {
            functions.push({
                retval: 'unknown',
                args: 'unknown',
                vma: address,
                name: symbol
            });
        }
    }

    return { symbols, functions };
}

async function readelf(file_path: string): Promise<{ sections: BinarySection[], base_address: number }> {
    const sections: BinarySection[] = [];

    const output = await spawn_and_read('readelf', ['-SlW', file_path]); // S: sections, W: wide
    const lines = output.split('\n');
    /*
    Section Headers:
    [Nr]  Name  Type  Address ...
    <Actual start of section headers>
    */
    let i = read_until(lines, 0, 'Section Headers:') + 2;
    for (; i < lines.length; i++) {
        const parts = lines[i].match(/\[(.+)\]\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+([A-Z]*)\s+(.+?)\s+(.+?)\s+(.+?)/);
        if (!parts)
            break; // no more sections from this point

        // remove the first element (which is the entire match)
        const [index, name, type, hex_address, offset, size, es, flags, lk, inf, al] = parts.splice(1);
        if (name === 'NULL')
            continue;

        sections.push({
            name: name,
            size: Number.parseInt(size, 16),
            vma: Number.parseInt(hex_address, 16),
            flags: flags.split('').map(f => get_section_flag(f)).filter(x => x !== undefined) as SectionFlag[]
        });
    }

    /*
    Program Headers:
    Type           Offset   VirtAddr           PhysAddr           FileSiz  MemSiz   Flg Align
    PHDR           0x000040 0x0000000000400040 0x0000000000400040 0x0001f8 0x0001f8 R E 0x8
    INTERP         0x000238 0x0000000000400238 0x0000000000400238 0x00001c 0x00001c R   0x1
        [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]
    LOAD           0x000000 0x0000000000400000 0x0000000000400000 0x006884 0x006884 R E 0x200000
    */
    let base_address = undefined;
    i = read_until(lines, i, 'Program Headers:') + 2;
    for (; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (!parts) {
            break;
        }

        if (parts[0] === 'LOAD') {
            base_address = Number.parseInt(parts[2], 16); // VirtAddr
            break;
        }
    }
    if (base_address === undefined) {
        console.warn(`Undefined base address for ${file_path}, defaulting to 0.`);
        base_address = 0;
    }

    return { sections, base_address };
}

async function file(file_path: string): Promise<string[]> {
    const output = (await spawn_and_read('file', [file_path])).trim();
    // file_name: XXXXXXXXX
    const desc = output.substring(output.indexOf(': ') + 2);
    return desc.split(', ');
}

async function objdump(file_path: string): Promise<{ sections: BinarySection[], base_address: number }> {
    const output = await spawn_and_read('objdump', ['-hw', file_path]);
    const lines = output.split('\n');

    const sections: BinarySection[] = [];

    // Idx  Name  Size  VMA  LMA   Fileoff  Algn  Flags
    for (let i = read_until(lines, 0, 'Idx') + 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(/(?<!,)\s+/);
        if (parts.length !== 8) {
            break;
        }

        const [index, name, size, vma, lma, file_offset, alignment, flags] = parts;
        sections.push({
            name,
            size: Number.parseInt(size, 16),
            vma: Number.parseInt(vma, 16),
            flags: flags.split(', ').map(x => get_section_flag(x)).filter(x => x !== undefined) as SectionFlag[]
        });
    }


    return { sections, base_address: sections[0].vma };
}

// see docs/example_load.json
interface Info {
    project_name: string;
    binary: BinaryInfo;
    live_mode: boolean; // whether or not we are analyzing raw bytes

    functions: BinaryFunction[];
    labels: unknown[]; // parsed client side
    sections: BinarySection[];
    comments: unknown[]; // TODO
    symbols: BinarySymbol[];
    branches: { srcAddr: number, targetAddr: number }[];
    default_permission_level: string;

    strings: { string: string, addr: number }[];
    // TODO: structTypes
    // TODO: structFieldTypes

    displayUnits: { size: number };
    // TODO: user
    architectures: string[];
    endians: string[];

    // our implementation specific data
    // binary_bytes: number[];
}

interface BinaryInfo {
    size: number;
    md5: string;
    sha1: string;
    desc: string[];
    name: string;
    malware: boolean; // always false
    benign: boolean; // always true
    text: string;
    options: BinaryOptions;
    base_address: number;
}

interface BinaryOptions {
    architecture?: string;
    endian?: string;
    selected_opts: string[];
}

interface BinaryFunction {
    retval: string;
    args: string;
    vma: number;
    name: string;
}

interface BinarySection {
    name: string;
    size: number;
    vma: number;
    flags: SectionFlag[];
}

interface BinarySymbol {
    name: string;
    vma: number;

    /*
    Lowercase = local, uppercase = global
    a: Value is absolute
    b: Bss section
    d: Initialized data section
    t: Text section - i.e. a function
    v: weak object
    r: Read only section
    */
    type: string;
}

interface SectionFlag {
    abbrev: string,
    desc: string,
    name: string
}

function get_section_flag(flag: string): SectionFlag | undefined {
    const flags: { [flag: string]: SectionFlag } = {
        'W': {
            abbrev: 'WRITE',
            desc: 'The section contains data that should be writable during process execution.',
            name: 'SHF_WRITE',
        },
        'A': {
            abbrev: 'ALLOC',
            desc: 'Tells the OS to allocate space for this section when loading. This is clear for a section containing debug information only.',
            name: 'SHF_ALLOC'
        },
        'X': {
            abbrev: 'EXEC',
            desc: 'The section contains executable machine instructions.',
            name: 'SHF_EXECINSTR',
        },
        'M': {
            abbrev: 'MERGE',
            desc: 'The data in the section may be merged to eliminate duplication. Unless the SHF_stringS flag is also set, the data elements in the section are of a uniform size. The size of each element is specified in the section header\'s sh_entsize field. If the SHF_stringS flag is also set, the data elements consist of null-terminated character strings. The size of each character is specified in the section header\'s sh_entsize field.',
            name: 'SHF_MERGE',
        },
        'S': {
            abbrev: 'STRINGS',
            desc: 'The data elements in the section consist of null-terminated character strings. The size of each character is specified in the section header\'s sh_entsize field.',
            name: 'SHF_STRINGS',
        },
        'I': {
            abbrev: 'INFO',
            desc: 'The sh_info field of this section header holds a section header table index.',
            name: 'SHF_INFO_LINK',
        },
        'L': {
            abbrev: 'LINK_ORDER',
            desc: 'This flag adds special ordering requirements for link editors. The requirements apply if the sh_link field of this section\'s header references another section (the linked-to section). If this section is combined with other sections in the output file, it must appear in the same relative order with respect to those sections, as the linked-to section appears with respect to sections the linked-to section is combined with.',
            name: 'SHF_LINK_ORDER',
        }
    };

    flags['ALLOC'] = flags['A'];
    flags['EXEC'] = flags['X'];
    flags['DATA'] = flags['W'];

    return flags[flag];
}
