import { assert } from 'chai';
import * as Chance from 'chance';
import Library from '../src/Library';
import CachedLibrary from '../src/CachedLibrary';
import 'mocha';

const chance = new Chance();

describe('CachedLibrary', function () {
    describe('constructor', function () {
        it('should fill in the expected fields when set through the constructor', async function () {
            const name = chance.string();
            const version = chance.string();
            const mainPath = chance.string();
            const lib = new Library(name, version, mainPath);

            const content = chance.string();

            const createdAt = chance.date();

            const cachedLib = new CachedLibrary(lib, content, createdAt);

            assert.equal(name, cachedLib.lib.name);
            assert.equal(version, cachedLib.lib.version);
            assert.equal(mainPath, cachedLib.lib.mainPath);

            assert.equal(content, cachedLib.content);
            assert.equal(Number(createdAt), cachedLib.createdAt);
        });
    });
});