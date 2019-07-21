import Library, { specialVersions, specialFiles } from './Library';

export default class MinifiedLibrary extends Library {
    constructor(
        public name: string, 
        public version: string|specialVersions = specialVersions.latest,
        public mainPath: string = specialFiles.mainFile,
        public minifiedPath?: string
    ) {
        super(name, version, mainPath);
    }
}