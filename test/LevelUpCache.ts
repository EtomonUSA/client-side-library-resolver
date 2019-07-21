import * as path from 'path';
import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as uglify from 'uglify-js';
import memdown from 'memdown';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import DummyRegistry, { JQ_DIR, JQ_FULL, JQ_MIN, JQ_PATH_FULL, JQ_PATH_MIN, JQ_PATH_PKG, JQ_PKG } from './DummyRegistry';
import LevelUpCache from '../src/LevelUpCache';
import { LibraryDoesNotExist, VersionDoesNotMatch, NoMain, NoMinifiedPath } from '../src/Registry';
import Library, { specialFiles } from '../src/Library';
import MinifiedLibrary from '../src/MinifiedLibrary';

import 'mocha';

const chance = new Chance();
const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const sepPool = '!@#$%^&*:;+-';
chai.use(chaiAsPromised);

const { assert } = chai;

describe('LevelUpCache', function () {
    let cache: LevelUpCache, registry: DummyRegistry;

    this.beforeEach(function () {
        registry = new DummyRegistry();
        cache = new LevelUpCache(registry, 5000, memdown());
    });

    describe('formatKey', function () {
        it(`should return the prefix lib name, lib version and lib main path`, function () {
            const name = chance.string({ pool });
            const version = chance.string({ pool });
            const mainPath = chance.string({ pool });
            const prefix = chance.string({ pool });
            const sep = chance.character({ pool: sepPool });

            const lib = new Library(name, version, mainPath);
            const key = (<any>cache).formatKey(lib, [], prefix);

            assert.equal([ prefix, name, version, mainPath ].join(sep), key);
        });

        it(`should return the prefix lib name, lib version and lib main path, plus any extra entries`, function () {
            const name = chance.string({ pool });
            const version = chance.string({ pool });
            const mainPath = chance.string({ pool });
            const prefix = chance.string({ pool });
            const sep = chance.character({ pool: sepPool });
            
            const extra = [];
            let i = 0;

            while (i < 15) {
                extra.push(chance.string({ pool }));
                i++;
            }

            const lib = new Library(name, version, mainPath);
            const key = (<any>cache).formatKey(lib, extra, prefix);

            assert.equal([ prefix, name, version, mainPath ].concat(extra).join(sep), key);
        });


        it(`should return the prefix lib name, lib version, lib main path, the minified path plus any extra entries`, function () {
            const name = chance.string({ pool });
            const version = chance.string({ pool });
            const mainPath = chance.string({ pool });
            const minPath = chance.string({ pool });
            const prefix = chance.string({ pool });
            const sep = chance.character({ pool: sepPool });
            
            const extra = [];
            let i = 0;

            while (i < 15) {
                extra.push(chance.string({ pool }));
                i++;
            }

            const lib = new MinifiedLibrary(name, version, mainPath, minPath);
            const key = (<any>cache).formatKey(lib, extra, prefix);

            assert.equal([ prefix, name, version, mainPath ].concat(extra).join(sep), key);
        });

    });


    describe('setCache', function () {
        it('should set the cache with a given value', async function () {
            const key = chance.string({ pool });
            const realValue = chance.string({ length: 250 });

            await (<any>cache).setCache(key, realValue);

            let value;
            let fn = () => {};
            try {
                value = await (<any>cache).db.get(key);
            } catch (err) {
                fn = () => { throw err; }
            } finally {
                assert.doesNotThrow(fn);

                assert.equal(realValue, value);
            }
        });
    });

    describe('getCache', function () {
        it('should retrieve a given value from the cache', async function () {
            const key = chance.string({ pool });
            const realValue = chance.string({ length: 250 });

            await (<any>cache).db.put(key, realValue);

            let value;
            let fn = () => {};
            try {
                value = await (<any>cache).db.get(key);
            } catch (err) {
                fn = () => { throw err; }
            } finally {
                assert.doesNotThrow(fn);

                assert.equal(realValue, value);
            }
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
            const lib = new MinifiedLibrary(chance.string({ length: 3 }), chance.string({ length: 3 }), chance.string({ length: 3 }), chance.string({ length: 3 }));

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should throw VersionDoesNotMatch if a library is passed whose directory can be found, but version does not match the version requested`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary('jquery', chance.string({ length: 3 }), specialFiles.mainFile, '/dist/jquery.min.js');

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, VersionDoesNotMatch);
        });

        it(`should return the path to the library's minified file`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary('jquery', 'latest', '/dist/jquery.js', '/dist/jquery.min.js');

            const result = await local.getMinifiedPath(lib);
            const realPath = path.join(modulesDir, 'jquery', 'dist', 'jquery.min.js');

            assert.equal(realPath, result);
        });

        it(`should throw NoMinifiedPath if a minified library is requested but no minified path has been specified`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary(chance.string({ length: 3 }));

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, NoMinifiedPath);
        });

        it(`should throw LibraryDoesNotExist if a minified library is requested but the minified path does not exist`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary('jquery', 'latest', specialFiles.mainFile, chance.string({ length: 3 }));

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });


        it(`should return the minified path if it exists`, async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary('jquery', 'latest', specialFiles.mainFile, '/dist/jquery.min.js');

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
            const lib = new MinifiedLibrary('jquery', '3.4.1', specialFiles.mainFile, '/dist/jquery.min.js');

            const realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.min.js'), 'utf8');

            const result = await local.getMinified(lib);;

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no version is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary('jquery', void(0), specialFiles.mainFile, '/dist/jquery.min.js');

            const realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.min.js'), 'utf8');

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no minified path is provided but the main path is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary('jquery', '3.4.1', specialFiles.mainFile);

            let realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');
            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no path is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary('jquery', '3.4.1', void(0));

            let realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');
            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no path and version is provided', async function () {
            const local = new LocalRegistry([ modulesDir ]);
            const lib = new MinifiedLibrary('jquery', void(0), void(0), void(0));

            let realJq = await fs.readFile(path.join(modulesDir, 'jquery', 'dist', 'jquery.js'), 'utf8');
            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });
    });
});