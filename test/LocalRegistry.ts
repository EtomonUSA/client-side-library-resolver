import * as path from 'path';
import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as uglify from 'uglify-js';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import LocalRegistry from '../src/LocalRegistry';
import { LibraryDoesNotExist, VersionDoesNotMatch, NoMain, NoMinifiedPath } from '../src/Registry';
import Library, { specialFiles } from '../src/Library';

import 'mocha';

chai.use(chaiAsPromised);

const { assert } = chai;

const chance = new Chance();

const modulesDir = path.join(__dirname, '..', 'node_modules');

describe('LocalRegistry', function () {
    
    describe('getLibDir', function () {
        it(`should return undefined if the library doesn't exist`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library(chance.string({ length: 2 }), chance.string(), chance.string(), chance.string());

            const result = await (<any>local).getLibDir(lib);

            assert.isUndefined(result);
        });

        it(`should return the path to the library if it exists in the module path`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', chance.string(), chance.string(), chance.string());

            const result = await (<any>local).getLibDir(lib);
            const actualLibDir = path.join(modulesDir, 'jquery');

            assert.equal(actualLibDir, result);
        });
    });

    describe('getManifest', function () {
        it('should throw LibraryDoesNotExist if the library provided is not in the modules folder', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library(chance.string({ length: 3 }));

            const p = local.getManifest(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it('should return the package.json file', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery');

            const file = await local.getManifest(lib);
            const realManifest = JSON.parse(await fs.readFile(path.join(modulesDir, 'jquery', 'package.json'), 'utf8'));

            assert.deepEqual(realManifest, file);
        });
    });

    describe('getPath', function () {
        it(`should throw LibraryDoesNotExist if a library is passed whose directory cannot be found`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library(chance.string({ length: 3 }));

            const p = local.getPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should throw VersionDoesNotMatch if a library is passed whose directory can be found, but version does not match the version requested`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', chance.string({ length: 3 }));

            const p = local.getPath(lib);

            await assert.isRejected(p, VersionDoesNotMatch);
        });

        it(`should throw LibraryDoesNotExist if a library is passed whose main file does not exist`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', 'latest', chance.string({ length: 3 }));

            const p = local.getPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should return the path to the library's main file`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery');

            const result = await local.getPath(lib);
            const realPath = path.join(modulesDir, 'jquery', 'dist', 'jquery.js');

            assert.equal(realPath, result);
        });
    });


    describe('getMinifiedPath', function () {
        it(`should throw LibraryDoesNotExist if a library is passed whose directory cannot be found`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library(chance.string({ length: 3 }), chance.string({ length: 3 }), chance.string({ length: 3 }), chance.string({ length: 3 }));

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should throw VersionDoesNotMatch if a library is passed whose directory can be found, but version does not match the version requested`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', chance.string({ length: 3 }), specialFiles.mainFile, '/dist/jquery.min.js');

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, VersionDoesNotMatch);
        });

        it(`should return the path to the library's minified file`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', 'latest', '/dist/jquery.js', '/dist/jquery.min.js');

            const result = await local.getMinifiedPath(lib);
            const realPath = path.join(modulesDir, 'jquery', 'dist', 'jquery.min.js');

            assert.equal(realPath, result);
        });

        it(`should throw NoMinifiedPath if a minified library is requested but no minified path has been specified`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library(chance.string({ length: 3 }));

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, NoMinifiedPath);
        });

        it(`should throw LibraryDoesNotExist if a minified library is requested but the minified path does not exist`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', 'latest', specialFiles.mainFile, chance.string({ length: 3 }));

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });


        it(`should return the minified path if it exists`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', 'latest', specialFiles.mainFile, '/dist/jquery.min.js');

            const libPath = await local.getMinifiedPath(lib);
            const realPath = path.join(modulesDir, 'jquery', 'dist', 'jquery.min.js')
            assert.equal(realPath, libPath);
        });
    });
    
    describe('get', function () {
        it('should return the full library if the library exists at a given version', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', '3.4.1', '/dist/jquery.js');

            const realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');

            const result = await local.get(lib);;

            assert.equal(realJq, result);
        });

        it('should return the full library if the library if no version is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', void(0), '/dist/jquery.js');

            const realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');

            const result = await local.get(lib);

            assert.equal(realJq, result);
        });

        it('should return the full library if the library if no path is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', '3.4.1', void(0));

            const realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');

            const result = await local.get(lib);

            assert.equal(realJq, result);
        });

        it('should return the full library if the library if no path and version is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', void(0), void(0));

            const realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');

            const result = await local.get(lib);

            assert.equal(realJq, result);
        });
    });

    describe('getMinified', function () {
        this.timeout(10000);
        it('should return the minified library if the library exists at a given version', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', '3.4.1', specialFiles.mainFile, '/dist/jquery.min.js');

            const realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.min.js'), 'utf8');

            const result = await local.getMinified(lib);;

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no version is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', void(0), specialFiles.mainFile, '/dist/jquery.min.js');

            const realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.min.js'), 'utf8');

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no minified path is provided but the main path is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', '3.4.1', specialFiles.mainFile);

            let realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');
            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no path is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', '3.4.1', void(0));

            let realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');
            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no path and version is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new Library('jquery', void(0), void(0), void(0));

            let realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');
            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });
    });
});