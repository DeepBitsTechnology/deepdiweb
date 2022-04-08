import { promises as fs } from 'fs';
import { get_project } from '../database';
import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

export default async function disassemble(req: Request, res: Response) {
    const short_name = req.params.short_name as string;
    if (!short_name) {
        res.status(400).send('Short name not provided');
        return;
    }

    const project = get_project(short_name);
    if (!project) {
        res.status(400).send(`${short_name} not found`);
        return;
    }

    try {
        // const form = new FormData();
        // const bytes = await fs.readFile(project.file_path);
        //
        // if (project.raw) {
        //     const byte_string = [...bytes].map(x => x.toString(16)).join(' ');
        //
        //     form.append('bytes', byte_string);
        //     form.append('arch', project.arch);
        //     form.append('mode', project.mode);
        // } else {
        //     form.append('file', bytes, 'filename');
        // }
        //
        // const resp = await axios.post(DEEPDI_URL,
        //     form.getBuffer(),
        //     {
        //         headers: form.getHeaders()
        //     }
        // );
        // res.status(200).json(resp.data);
        const raw = await fs.readFile(__dirname + '/../sample_output/file.json');
        res.status(200).type('json').send(raw);
    }
    catch (ex) {
        console.log(`An error occured while trying to disassemble.\n${ex}`);
        console.log((ex as AxiosError).response);
        res.status(400).send('Unable to disassemble');
    }
}

export async function disassemble_bytes(req: Request, res: Response) {
    try {
        // const { bytes, arch, mode } = req.body;
        // if (!bytes || !arch || !mode) {
        //     res.status(400).send('Bytes|Arch|Mode not provided.');
        //     return;
        // }
        //
        // const form = new FormData();
        // form.append('bytes', bytes);
        // form.append('arch', arch);
        // form.append('mode', mode);
        //
        // const resp = await axios.post(DEEPDI_URL,
        //     form.getBuffer(),
        //     {
        //         headers: form.getHeaders()
        //     }
        // );
        // res.status(200).json(resp.data);
        const raw = await fs.readFile(__dirname + '/../sample_output/bytes.json');
        res.status(200).type('json').send(raw);
    }
    catch (ex) {
        console.log(`An error occured while trying to disassemble.\n${ex}`);
        console.log((ex as AxiosError).response);
        res.status(400).send('Unable to disassemble');
    }
}