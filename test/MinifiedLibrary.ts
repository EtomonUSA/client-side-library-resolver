import { assert } from 'chai';
import * as Chance from 'chance';
import 'mocha';
import MinifiedLibrary from '../src/MinifiedLibrary';

const chance = new Chance();

describe('Library', function () {
    describe('constructor', function () {
        it('should fill in the expected fields when set through the constructor', async function () {
            const name = chance.string();
            const version = chance.string();
            const mainPath = chance.string();
            const minPath = chance.string();
            const lib = new MinifiedLibrary(name, version, mainPath, minPath);

            assert.equal(name, lib.name);
            assert.equal(version, lib.version);
            assert.equal(mainPath, lib.mainPath);
            assert.equal(minPath, lib.minifiedPath);
        });
    });
});