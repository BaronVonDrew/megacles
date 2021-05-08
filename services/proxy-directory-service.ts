import { rename, symlink, unlink, mkdir, rm } from "fs/promises";
import path from 'path';
export class ProxyDirectoryService {
    async delete(backup: string): Promise<void> {
        console.log(`removing ${backup}`);
        await rm(backup, {
            recursive: true,
            force: true
        });
    } 
    async backup(proxyLocation: string, backupLocation: string): Promise<void> { 
        console.log(`moving contents of ${proxyLocation} to ${backupLocation}`);
        await mkdir(backupLocation, { recursive: true });
        await rename(proxyLocation, backupLocation);
    }
    async proxy(proxyLocation: string, sourcePath: string): Promise<void> { 
        console.log(`creating junction at ${proxyLocation} pointing to ${sourcePath}`);
        let target = path.resolve(sourcePath);
        let linkPath = path.resolve(proxyLocation);
        await symlink(
            target, 
            linkPath, 
            'junction'
        );
    }
    async unproxy(proxyLocation: string): Promise<void> { 
        console.log(`removing junction at ${proxyLocation}`);
        let linkPath = path.resolve(proxyLocation);
        await unlink(linkPath);
    }
    async restore(proxyLocation: string, backupLocation: string): Promise<void> { 
        console.log(`moving contents of ${backupLocation} back to ${proxyLocation}`);
        await mkdir(proxyLocation, { recursive: true });
        await rename(backupLocation, proxyLocation);
    }
}
const proxyDirectoryService = new ProxyDirectoryService;
export default proxyDirectoryService;