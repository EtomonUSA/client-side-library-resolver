import { assert } from 'chai';
import * as Chance from 'chance';
import Library from '../src/Library';
import 'mocha';

const chance = new Chance();

describe('Library', function () {
    describe('constructor', function () {
        it('should fill in the expected fields when set through the constructor', async function () {
            const name = chance.string();
            const version = chance.string();
            const path = chance.string();
            const minPath = chance.string();
            const lib = new Library(name, version, path, minPath);

            assert.equal(name, lib.name);
            assert.equal(version, lib.version);
            assert.equal(path, lib.path);
            assert.equal(minPath, lib.minifiedPath);
        });
    });
});