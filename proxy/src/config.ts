import process, { exit } from 'process';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/cache';
export const MAX_PROJECTS_CACHED = Number.parseInt(process.env.MAX_PROJECTS_CACHED || '50');

export const DEEPDI_URL = process.env.DEEPDI_URL || '';
if (DEEPDI_URL === '') {
    console.error('DEEPDI_URL is not set, exiting.');
    exit(1);
}
