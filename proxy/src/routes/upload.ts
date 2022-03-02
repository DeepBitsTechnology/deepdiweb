import { UploadedFile } from 'express-fileupload';
import { generate_id } from '../util';
import { MAX_PROJECTS_CACHED, UPLOAD_DIR } from '../config';
import { Request, Response } from 'express';
import { Stats, promises as fs } from 'fs';
import { add_project, delete_project } from '../database';


export default async function upload(req: Request, res: Response) {
    try {
        const { project_name, arch, mode } = req.body;
        const file = req.files?.filedata as UploadedFile;
        if (!file) {
            res.status(400).send('no file provided');
            return;
        }

        // create a short_name for the file, and rename the uploaded file to it
        const short_name = generate_id();
        const file_path = `${UPLOAD_DIR}/${short_name}`;
        await fs.rename(file.tempFilePath, file_path);
        add_project(short_name, {
            project_name: file.name || project_name || short_name,
            file_path,

            raw: arch !== 'detect',
            arch,
            mode
        });

        res.status(200).json({ short_name });

        // remove any files past our upload limit
        await clear_cache_if_over();
    }
    catch (ex) {
        console.error(`An error occured while trying to upload a file: ${ex}`);
        res.status(400).send('An error occured while trying to process the file upload.');
    }

}

async function clear_cache_if_over() {
    const files = await fs.readdir(UPLOAD_DIR);
    const file_infos: { file: string, stats: Stats }[] = [];

    await Promise.all(files.map(async (file) => {
        const stats = await fs.stat(`${UPLOAD_DIR}/${file}`);
        file_infos.push({ file, stats });
    }));

    // sort by ascending order, i.e, oldest files first
    file_infos.sort((a, b) => a.stats.birthtimeMs - b.stats.birthtimeMs);

    const files_to_remove = file_infos.length - MAX_PROJECTS_CACHED;
    for (let i = 0; i < files_to_remove; i++) {
        const name = file_infos[i].file;
        await fs.rm(`${UPLOAD_DIR}/${name}`);
        delete_project(name);
    }
}