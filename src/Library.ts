export enum specialFiles {
    mainFile = '~MAIN_FILE~'
}

export enum specialVersions {
    latest = 'latest' 
}

export default class Library {
    constructor(
        public name: string, 
        public version: string|specialVersions = specialVersions.latest,
        public mainPath: string|specialFiles = specialFiles.mainFile
    ) {

    }
}