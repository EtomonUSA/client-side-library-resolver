import levelup, { LevelUp } from 'levelup';
import { AbstractLevelDOWN,  } from 'abstract-leveldown';
import encode from 'encoding-down';
import CachedLibrary from './CachedLibrary';
import RegistryCache, { specialValues } from './RegistryCache';
import Registry from './Registry';
import Library from './Library';
import MinifiedLibrary from './MinifiedLibrary';


export default class LevelUpCache extends RegistryCache {
    protected db: LevelUp;
    constructor(protected registry: Registry, public ttl: number, protected levelDown: AbstractLevelDOWN, protected keyPrefix?: string) {
        super(registry, ttl);
        this.db = levelup(encode<string, any>(levelDown, { valueEncoding: 'json' }));
    }
    
    protected formatKey(lib: Library|MinifiedLibrary, extra: string[] = [], prefix: string = this.keyPrefix, sep: string = ':'): string
    {
        return [ prefix, lib.name, lib.version, lib.mainPath, (lib instanceof MinifiedLibrary ? lib.minifiedPath : void(0)) ].concat(extra).filter(Boolean).join(sep);
    }

    
    protected async setCache(key: string, value: any) {
        await this.db.put(key, value);
    }

    protected async getCache(key: string): Promise<any> {
        await this.db.get(key);
    }

    protected async setCacheLib(lib: Library, content: string) {
        const cachedLib = new CachedLibrary(lib, content);

        await this.setCache(this.formatKey(lib), cachedLib);
    }

    protected async getCacheLib(lib: Library): Promise<string> {
        try {
            const key = this.formatKey(lib);
            const cachedLib = <CachedLibrary>(await this.getCache(key));
            
            if ((new Date().getTime() - this.ttl) < cachedLib.createdAt) 
                return cachedLib.content;

            await this.db.del(key);   

            return null;
        } catch (err) {
            if (err.notFound) {
                return null;
            }

            throw err;
        }
    }

    public async getManifest(lib: Library): Promise<string> {
        const key = this.formatKey(lib, [ specialValues.manifest ]);
        const cachedManifest = await this.getCache(key);

        if (cachedManifest) {
            return cachedManifest;
        }
        
        const manifest = await this.registry.getManifest(lib);
        
        await this.setCache(key, manifest);

        return manifest;
    }

    public async getMinifiedPath(lib: MinifiedLibrary): Promise<string> {
        const key = this.formatKey(lib, [ specialValues.minifiedPath ]);
        const cachedMinifiedPath = await this.getCache(key);

        if (cachedMinifiedPath) {
            return cachedMinifiedPath;
        }
        
        const minifiedPath = await this.registry.getMinified(lib);
        
        await this.setCache(key, minifiedPath);

        return minifiedPath;
    }


    public async getMinified(lib: MinifiedLibrary): Promise<string> {
        const cachedMinified = this.getCacheLib(lib);

        if (cachedMinified) {
            return cachedMinified;
        }
        
        const minified = await this.registry.getMinified(lib);
        
        await this.setCacheLib(lib, minified);

        return minified;
    }

    public async getPath(lib: Library): Promise<string> {
        const key = this.formatKey(lib, [ specialValues.mainPath ]);
        const cachedMainPath = await this.getCache(key);

        if (cachedMainPath) {
            return cachedMainPath;
        }
        
        const minifiedPath = await this.registry.getMinified(lib);
        
        await this.setCache(key, minifiedPath);

        return minifiedPath;
    }


    public async get(lib: Library): Promise<string> {
        const cached = this.getCacheLib(lib);

        if (cached) {
            return cached;
        }
        
        const code = await this.registry.get(lib);
        
        await this.setCacheLib(lib, code);

        return code;
    }

}