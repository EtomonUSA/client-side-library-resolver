
import * as path from 'path';
import * as fs from 'fs-extra';
import Registry, { LibraryDoesNotExist, VersionDoesNotMatch, NoMain, NoMinifiedPath } from './Registry';
import Library, { specialFiles, specialVersions } from './Library';
import MinifiedLibrary from './MinifiedLibrary';

export default class LocalRegistry extends Registry {
    constructor(protected dirs = module.paths) {
        super();
    }

    public async getManifest(lib: Library): Promise<any> {
        const libDir = await this.getLibDir(lib);

        if (!libDir)
            throw new LibraryDoesNotExist(lib);

        return JSON.parse(await fs.readFile(path.join(libDir, 'package.json'), 'utf8'));
    }

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

        
        if ((typeof(lib.version) !== 'undefined' && lib.version !== specialVersions.latest) && packageJson.version !== lib.version) {
            throw new VersionDoesNotMatch(lib, packageJson.version);
        }

        const libPath = path.join(libDir, (
            lib.mainPath === specialFiles.mainFile ?
            packageJson.main :
            lib.mainPath
        ));

        if (!packageJson.main || !(await fs.pathExists(libPath))) {
            throw new NoMain(lib);
        }

        return libPath;
    }

    public async getMinifiedPath(lib: MinifiedLibrary): Promise<string> {
        if (!lib.minifiedPath) 
            throw new NoMinifiedPath(lib);

        const libDir = await this.getLibDir(lib);

        if (!libDir || !(await fs.pathExists))
            throw new LibraryDoesNotExist(lib)

        const packageJson = await this.getManifest(lib);

        if ((typeof(lib.version) !== 'undefined' && lib.version !== specialVersions.latest) && packageJson.version !== lib.version) {
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

    public async getMinified(lib: MinifiedLibrary): Promise<string> {
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