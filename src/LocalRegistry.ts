
import * as path from 'path';
import * as fs from 'fs-extra';
import * as semver from 'semver';
import Registry, { LibraryDoesNotExist, VersionDoesNotMatch, NoMain, NoMinifiedPath } from './Registry';
import Library, { SpecialFiles, SpecialVersions } from './Library';

/**
 * Represents the local `node_modules` folder or any other `node_modules` folder in the module path. 
 */
export default class LocalRegistry extends Registry {
    /**
     * 
     * @param dirs - Directories to search for libraries in. Defaults to `module.paths`. 
     */
    constructor(protected dirs = module.paths) {
        super();
    }

    public async getManifest(lib: Library): Promise<any> {
        const libDir = await this.getLibDir(lib);

        if (!libDir)
            throw new LibraryDoesNotExist(lib);

        return JSON.parse(await fs.readFile(path.join(libDir, 'package.json'), 'utf8'));
    }

    /**
     * Retrieves the full path to the directory containing a given library
     */
    protected async getLibDir(lib: Library) {
        const modulesDirs = (
            await Promise.all(this.dirs.map(async (dir) => {
                const doesExist = await fs.pathExists(path.join(dir, lib.name));

                return doesExist ? dir : void(0);
            }))
        ).filter(Boolean);

        if (!modulesDirs || !modulesDirs.length)
            return void(0);
        
        return path.join(modulesDirs[0], lib.name);
    }

    public async getPath(lib: Library) {
        const packageJson = await this.getManifest(lib);

        const libDir = await this.getLibDir(lib);

        if (!libDir || !(await fs.pathExists))
            throw new LibraryDoesNotExist(lib)

        
        if ((typeof(lib.version) !== 'undefined' && lib.version !== SpecialVersions.latest) && !semver.satisfies(packageJson.version, lib.version)) {
            throw new VersionDoesNotMatch(lib, packageJson.version);
        }

        const libPath = path.join(libDir, (
            lib.path === SpecialFiles.mainFile ?
            packageJson.main :
            lib.path
        ));


        if (!(await fs.pathExists(libPath))) {
            throw new NoMain(lib);
        }

        return libPath;
    }


    public async getMinifiedPath(lib: Library): Promise<string> {
        if (!lib.minifiedPath) 
            throw new NoMinifiedPath(lib);

        const libDir = await this.getLibDir(lib);

        if (!libDir || !(await fs.pathExists))
            throw new LibraryDoesNotExist(lib)

        const packageJson = await this.getManifest(lib);

        if ((typeof(lib.version) !== 'undefined' && lib.version !== SpecialVersions.latest) && !semver.satisfies(packageJson.version, lib.version)) {
            throw new VersionDoesNotMatch(lib, packageJson.version);
        }

        const libPath = path.join(libDir, lib.minifiedPath);

        if (!(await fs.pathExists(libPath)))
            throw new LibraryDoesNotExist(lib, libPath);

        return libPath;
    }


    public async get(lib: Library): Promise<string> {
        const libPath = await this.getPath(lib);

        return await fs.readFile(libPath, 'utf8');
    }

    public async getMinified(lib: Library): Promise<string> {
        try {
            const libPath = await this.getMinifiedPath(lib);
            
            const text = await fs.readFile(libPath, 'utf8');
            return text;
        }
        catch (err) {
            if (err instanceof LibraryDoesNotExist || err instanceof NoMinifiedPath) {
                return await super.getMinified(lib);
            } else {
                throw err;
            }
        }   
    }
}