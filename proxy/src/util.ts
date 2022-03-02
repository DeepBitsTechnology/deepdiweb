import { spawn } from 'child_process';

/**
 * Generates an id of length 8, not guaranteed to be unique
 */
export function generate_id() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++)
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
    return id;
}

// 
export function read_until(lines: string[], start: number, target: string) {
    for (let i = start; i < lines.length; i++) {
        if (lines[i].trim().startsWith(target))
            return i;
    }

    return 0;
}

export function spawn_and_read(command: string, options: string[]): Promise<string> {
    return new Promise<string>((resolve) => {
        const process = spawn(command, options);

        if (!process.stdout) {
            console.error(`Error spawning process ${command} with options ${options}`);
            resolve('');
            return;
        }

        let output = '';
        process.stdout.on('data', (data) => output += data);

        let stderr = '';
        process.stderr.on('data', (data) => stderr += data);

        process.on('close', (code) => {
            if (code !== 0) {
                console.warn(`Command ${command} exited with non-zero code ${code}`);
                console.log(stderr);
            }

            resolve(output);
        });
    });
}