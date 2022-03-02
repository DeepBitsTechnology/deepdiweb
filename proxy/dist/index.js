"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const config_1 = require("./config");
const server = (0, express_1.default)();
server.use((req, res, next) => {
    console.log(`[${(new Date()).toISOString()}] ${req.method} ${req.url} (${res.statusCode})`);
    next();
});
server.use(express_1.default.json());
server.use((0, express_fileupload_1.default)({
    safeFileNames: true,
    useTempFiles: true,
    tempFileDir: config_1.UPLOAD_DIR
}));
server.use(express_1.default.static('frontend'));
server.use((0, cors_1.default)());
server.use('/odaweb/', routes_1.default);
server.listen(3000, () => {
    console.log('Server is ready to accept requests!');
});
