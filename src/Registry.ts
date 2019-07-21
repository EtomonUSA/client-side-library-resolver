import * as uglify from 'uglify-js';
import { default as Library, specialFiles } from './Library';

export class NoMinifiedPath extends Error {
    constructor(public lib: Library) {
        super(`Library ${lib.name} does not have a minifiedPath but the minified path was requested.`);
    }
}

export class LibraryDoesNotExist extends Error {
    constructor(public lib: Library, public fullPath?: string, otherMessage?: string, ) {
        super( otherMessage? otherMessage: (fullPath ? `Library ${lib.name} cannot be found at "${fullPath}"` : `Path for ${lib.name} was not provided and default path either does not exist or could not be resolved.`));
    }
}

export class VersionDoesNotMatch extends LibraryDoesNotExist {
    constructor(public lib: Library, public foundVersion: string) {
        super(lib, void(0), `Requested ${lib.name}@${lib.version} but could only find ${lib.name}@${foundVersion}`);
    }
}

export class NoMain extends LibraryDoesNotExist {
    constructor(lib: Library) {
        super(lib, void(0), `Main file for ${lib.name} either was not specified or does not exist.`)
    }
}

export default abstract class Registry {
    /**
     * Retrieves the the full path to a given library at a given version. Will use the file located at the `main` property of the `package.json` associated with the library if `lib.path` is not set.
     * 
     * Will throw an error if the library cannot be located at the given path at the given version.
     */
    public abstract getPath(lib: Library): Promise<string>;

    /**
     * Retrieves the the full path to the minified copy of a given library.
     * 
     * Will throw an error if the minified path the library was not specified, or if the library cannot be located at the given version.
     */
    public abstract getMinifiedPath(lib: Library): Promise<string>;
    
    /**
     * Retrieves the full text for a given library.
     */
    public abstract get(lib: Library): Promise<string>;

    /**
     * Retrieves the `package.json` file for a given library.
     */
    public abstract getManifest(lib: Library): Promise<any>;

        
    /**
     * Retrieves the full text for the minified copy of a given library.
     */
    public async getMinified(lib: Library): Promise<string> {
        const libText = await this.get(lib);

        return uglify.minify(libText).code;
    }
}