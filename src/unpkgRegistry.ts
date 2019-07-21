import * as request from 'request-promise-native';
import { StatusCodeError } from 'request-promise-native/errors';
import Registry, { LibraryDoesNotExist, VersionDoesNotMatch, NoMinifiedPath } from './Registry';
import Library, { specialFiles, specialVersions } from './Library';

/**
 * Represents the unpkg.com registry.
 */
export default class unpkgRegistry extends Registry {
    protected request: request.RequestPromiseAPI;
    protected unpkgUrlBase: string = 'https://unpkg.com';

    constructor(public requestOptions: any = ({  })) {
        super();

        requestOptions.followAllRedirects = true;

        this.request = request.defaults(requestOptions);
    } 

    public async getManifest(lib: Library): Promise<any> {
        try {
            const res = await this.request({
                url: `${this.unpkgUrlBase}/${lib.name}@${lib.version}/package.json`,
                resolveWithFullResponse: true
            });

            return JSON.parse(Buffer.from(res.body).toString('utf8'));
        } catch (err) {
            if (err instanceof StatusCodeError && err.statusCode === 404) 
                throw new LibraryDoesNotExist(lib);
            else
                throw err; 
        }
    }

    public async getPath(lib: Library): Promise<string> {
        let url;
        try {
            
            if (lib.version === specialVersions.latest && lib.path === specialFiles.mainFile) {
                url = `${this.unpkgUrlBase}/${lib.name}`;
            } else if (lib.path === specialFiles.mainFile) {
                url = `${this.unpkgUrlBase}/${lib.name}@${lib.version}`;
            } else {
                const packageJson = await this.getManifest(lib);

                let mainPath = (lib.path !== specialFiles.mainFile) ? lib.path : ('/' + packageJson.main);
                url = `${this.unpkgUrlBase}/${lib.name}@${lib.version}${mainPath}`
            }

            const res = await this.request({
                method: 'HEAD',
                url,
                resolveWithFullResponse: true
            });

            return res.request.href;
        } catch (err) {
            if (err instanceof StatusCodeError && err.statusCode === 404) 
                throw new LibraryDoesNotExist(lib, url);
            else
                throw err; 
        }
    }

    public async getMinifiedPath(lib: Library): Promise<string> {
        let url;

        if (!lib.minifiedPath)
            throw new NoMinifiedPath(lib);

        try {
            url = `${this.unpkgUrlBase}/${lib.name}@${lib.version}${lib.minifiedPath}`

            const res = await this.request({
                method: 'HEAD',
                url,
                resolveWithFullResponse: true
            });

            return res.request.href;
        } catch (err) {
            if (err instanceof StatusCodeError && err.statusCode === 404) 
                throw new LibraryDoesNotExist(lib, url);
            else
                throw err; 
        }
    }
    

    async get(lib: Library): Promise<string> {
        const url = await this.getPath(lib);

        return await this.request({
            url
        });
    }

    async getMinified(lib: Library): Promise<string> {
        try {
            const url = await this.getMinifiedPath(lib);
            
            return await this.request({
                url
            });
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