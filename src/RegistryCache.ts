import Registry from './Registry';
import Library from './Library';
import CachedLibrary from './CachedLibrary';

export enum specialValues {
    manifest = '~MANIFEST~',
    minifiedPath = '~MINIFIED_PATH~',
    mainPath = '~MAIN_PATH~'
}

export default abstract class RegistryCache extends Registry {
    constructor(protected registry: Registry, public ttl: number) {
        super();
    }
    
    protected abstract async setCache(key: string, value: any);
    protected abstract async getCache(key: String): Promise<any>;

    protected abstract async setCacheLib(lib: Library, content: string);
    protected abstract async getCacheLib(lib: Library): Promise<string>;
}