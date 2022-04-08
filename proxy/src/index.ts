import { UPLOAD_DIR } from './config';
import cors from 'cors';
import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import router from './routes';

const server = express();

server.use((req, res, next) => {
    console.log(`[${(new Date()).toISOString()}] ${req.method} ${req.url} (${res.statusCode})`);
    next();
});

server.use(express.json());
server.use(fileUpload({
    safeFileNames: true,
    useTempFiles: true,
    tempFileDir: UPLOAD_DIR
}));
server.use(express.static(path.join(__dirname, 'frontend')));
server.use(cors());

server.use('/odaweb/', router);

server.listen(8001, () => {
    console.log('Server is ready to accept requests!');
});