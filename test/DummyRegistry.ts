import Registry from '../src/Registry';
import * as path from 'path';
import * as fs from 'fs-extra';
import Library, { specialFiles } from '../src/Library';
import MinifiedLibrary from '../src/MinifiedLibrary';
import * as uglify from 'uglify-js';

export const JQ_DIR = path.join(__dirname, '..', 'node_modules', 'jquery');
export const JQ_PATH_MIN = path.join(JQ_DIR, 'dist', 'jquery.min.js');
export const JQ_PATH_FULL = path.join(JQ_DIR, 'dist', 'jquery.js');
export const JQ_PATH_PKG = path.join(JQ_DIR, 'package.json');
export const JQ_PKG = JSON.parse(fs.readFileSync(JQ_PATH_PKG, 'utf8'));
export const JQ_FULL = fs.readFileSync(JQ_PATH_FULL, 'utf8');
export const JQ_MIN = fs.readFileSync(JQ_PATH_MIN, 'utf8');

Object.freeze(JQ_PKG);

export default class DummyRegistry extends Registry {
    constructor() {
        super();
    }

    public async getManifest(lib: Library): Promise<any> {
        return JQ_PKG;
    }

    public async getMinifiedPath(lib: MinifiedLibrary): Promise<string> {
       return JQ_PATH_MIN;
    }


    public async getMinified(lib: MinifiedLibrary): Promise<string> {
        if (typeof(lib.minifiedPath) === 'undefined') {
            return uglify.minify(JQ_FULL).code;
        }

        return JQ_MIN;
    }

    public async getPath(lib: Library): Promise<string> {
        return JQ_PATH_FULL;
    }


    public async get(lib: Library): Promise<string> {
        return JQ_FULL;
    }
}