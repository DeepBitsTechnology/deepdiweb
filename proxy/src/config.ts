import process from 'process';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/cache';
export const MAX_PROJECTS_CACHED = Number.parseInt(process.env.MAX_PROJECTS_CACHED || '100');
export const MAX_UPLOADS = Number.parseInt(process.env.MAX_UPLOADS || '50');
export const DEEPDI_URL = (process.env.DEEPDI_URL || 'error');
