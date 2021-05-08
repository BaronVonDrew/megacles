import { glob } from 'glob';

export class FileGlobService {
    getDirectoriesFromGlob(
        proxyLocation: string, 
        backupLocation: string, 
        globString: string)
        : { proxy: string, backup: string }[] {
            
            let searchString = globString.endsWith('/')
                ? globString
                : `${globString}/`;

            return glob.sync(searchString, { 
                cwd: proxyLocation
            }).map(path => { 
                const proxy = `${proxyLocation}/${path}`;
                const backup = `${backupLocation}/${path}`;
                return { 
                    proxy: proxy.substring(0, proxy.length -1),
                    backup: backup.substring(0, backup.length -1)
                };
            });
    } 
}

const fileGlobService = new FileGlobService;
export default fileGlobService;