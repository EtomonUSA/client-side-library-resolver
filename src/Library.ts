/**
 * Special files that can exist within the library.
 */
export enum SpecialFiles {
    /**
     * The file at the `main` property of package.json.
     */
    mainFile = '%manifest.main%'
}

/**
 * Non-semver versions of special significance.
 */
export enum SpecialVersions {
    /**
     * The most recent version of the package.
     */
    latest = 'latest' 
}

/**
 * File types that are supported.
 */
export enum FileTypes {
    /**
     * JavaScript.
     */
    js = 'js',
    /**
     * CSS.
     */
    css = 'css'
}

/**
 * Represents a single software package within the repository. Can either be CSS or JS.
 */
export default class Library {
   
    /**
     * 
     * @param name - Name of the software package (e.g. `bootstrap`).
     * @param version - The version of the software to match against. Should be semver compatible (e.g. `1.0.0`, `1` or `latest`). Defaults to `latest`.
     * @param path - Path to the main (non-minified) copy of the file. Defaults to the `main` property in the package.json file.
     * @param minifiedPath - Path to the minified copy of the file. Will attempt to minify the file at the `main` path if not provided.
     * @param fileType - Indicates the file type of the library, defaults to `js`.
     */
    constructor(
        public name: string, 
        public version: string|SpecialVersions = SpecialVersions.latest,
        public path: string|SpecialFiles = SpecialFiles.mainFile,
        public minifiedPath?: string,
        public fileType: FileTypes = FileTypes.js
    ) {

    }
}