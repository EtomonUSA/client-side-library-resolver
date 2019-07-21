import * as path from 'path';
import * as request from 'request-promise-native';
import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as uglify from 'uglify-js';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as lodash from 'lodash';
import unpkgRegistry from '../src/unpkgRegistry';
import { LibraryDoesNotExist, NoMinifiedPath } from '../src/Registry';
import Library, { specialFiles } from '../src/Library';

import 'mocha';

chai.use(chaiAsPromised);

const modulesDir = path.join(__dirname, '..', 'node_modules');
const chance = new Chance();

const { assert } = chai;
const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

describe('unpkgRegistry', function () {
    describe('getManifest', function () {
        it('should throw LibraryDoesNotExist if the library provided is not in the modules folder', async function () {
            const local = new unpkgRegistry();
            const lib = new Library(chance.string({ length: 25, pool }));

            const p = local.getManifest(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it('should return the package.json file', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery');

            const file = await local.getManifest(lib);

            const realManifest = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery/package.json',
                followAllRedirects: true,
                transform: (d) => JSON.parse(d)
            });
            
            assert.deepEqual(realManifest, file);
        });
    });

    
    describe('getPath', function () {
        it(`should throw LibraryDoesNotExist if a library is passed whose URL cannot be found`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library(chance.string({ length: 25, pool }));

            const p = local.getPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should throw LibraryDoesNotExist if a library is passed whose directory can be found, but version does not match the version requested`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', chance.string({ length: 25, pool  }));

            const p = local.getPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should throw LibraryDoesNotExist if a library is passed whose main file does not exist`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', 'latest', chance.string({ length: 25, pool  }));

            const p = local.getPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should return the URL to the library's main file`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery');

            const response = await request({
                method: 'HEAD',
                url: 'https://unpkg.com/jquery',
                resolveWithFullResponse: true,
                followAllRedirects: true
            });

            const result = await local.getPath(lib);
            
            assert.equal(response.request.href, result);
        });
    });


    describe('getMinifiedPath', function () {
        it(`should throw LibraryDoesNotExist if a library is passed whose URL cannot be found`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library(chance.string({ length: 25, pool }), chance.string({ length: 25, pool }), chance.string({ length: 25, pool }), chance.string({ length: 25, pool }));

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should throw LibraryDoesNotExist if a library is passed whose directory can be found, but version does not match the version requested`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', chance.string({ length: 25, pool  }), specialFiles.mainFile, '/dist/jquery.min.js');

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });

        it(`should return the path to the library's minified file`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', 'latest', '/dist/jquery.js', '/dist/jquery.min.js');

            const response = await request({
                method: 'HEAD',
                url: 'https://unpkg.com/jquery/dist/jquery.min.js',
                resolveWithFullResponse: true,
                followAllRedirects: true
            });

            const realPath = response.request.href;

            const result = await local.getMinifiedPath(lib);

            assert.equal(realPath, result);
        });

        it(`should throw NoMinifiedPath if a minified library is requested but no minified path has been specified`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery');

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, NoMinifiedPath);
        });

        it(`should throw LibraryDoesNotExist if a minified library is requested but the minified path does not exist`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', 'latest', specialFiles.mainFile, chance.string({ length: 3 }));

            const p = local.getMinifiedPath(lib);

            await assert.isRejected(p, LibraryDoesNotExist);
        });


        it(`should return the minified path if it exists`, async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', 'latest', specialFiles.mainFile, '/dist/jquery.min.js');

            const response = await request({
                method: 'HEAD',
                url: 'https://unpkg.com/jquery/dist/jquery.min.js',
                resolveWithFullResponse: true,
                followAllRedirects: true
            });

            const realPath = response.request.href;

            const libPath = await local.getMinifiedPath(lib);
            assert.equal(realPath, libPath);
        });
    });
    
    describe('get', function () {
        it('should return the full library if the library exists at a given version', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', '3.4.1', '/dist/jquery.js');

            const realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery@3.4.1/dist/jquery.js',
                followAllRedirects: true
            });

            const result = await local.get(lib);

            assert.equal(realJq, result);
        });

        it('should return the full library if the library if no version is provided', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', void(0), '/dist/jquery.js');

            const realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery/dist/jquery.js',
                followAllRedirects: true
            });
            const result = await local.get(lib);

            assert.equal(realJq, result);
        });

        it('should return the full library if the library if no path is provided', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', '3.4.1', void(0));

            const realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery@3.4.1',
                followAllRedirects: true
            });
            const result = await local.get(lib);

            assert.equal(realJq, result);
        });

        it('should return the full library if the library if no path and version is provided', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery');

            const realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery',
                followAllRedirects: true
            });

            const result = await local.get(lib);

            assert.equal(realJq, result);
        });
    });

    describe('getMinified', function () {
        this.timeout(10000);
        it('should return the minified library if the library exists at a given version', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', '3.4.1', specialFiles.mainFile, '/dist/jquery.min.js');

            const realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery@3.4.1/dist/jquery.min.js',
                followAllRedirects: true
            });

            const result = await local.getMinified(lib);;

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no version is provided', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', void(0), specialFiles.mainFile, '/dist/jquery.min.js');

            const realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery/dist/jquery.min.js',
                followAllRedirects: true
            });

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no minified path is provided but the main path is provided', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', '3.4.1', specialFiles.mainFile);

            let realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery@3.4.1/dist/jquery.js',
                followAllRedirects: true
            });

            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no path is provided', async function () {
            const local = new unpkgRegistry();
            const lib = new Library('jquery', '3.4.1', void(0));

            let realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery@3.4.1/dist/jquery.js',
                followAllRedirects: true
            });

            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });

        it('should return the minified library if the library if no path and version is provided', async function () {
            const local = new unpkgRegistry([ modulesDir ]);
            const lib = new Library('jquery', void(0), void(0), void(0));

            let realJq = await request({
                method: 'GET',
                url: 'https://unpkg.com/jquery/dist/jquery.js',
                followAllRedirects: true
            });

            realJq = uglify.minify(realJq).code;

            const result = await local.getMinified(lib);

            assert.equal(realJq, result);
        });
    });
});