#!/usr/bin/env node
import chokidar from 'chokidar';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import Arguments from './models/arguments';
import fileGlobService from './services/file-glob-service';
import proxyDirectoryService from './services/proxy-directory-service';
import prompt from 'prompt';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { exec } from 'child_process';

const subscriptions: Subscription[] = [];
const argv: Arguments = yargs(hideBin(process.argv))
    .options({ 
        sourcePath: { type: 'string', alias: 's', description: 'The path you want proxied elsewhere'},
        proxyLocation: { type: 'string', alias: 'p', description: 'The location to proxy the original source'},
        backupLocation: { type: 'string', alias: 'b', description: 'The location to backup the existing proxy folder\' contents' },
        restore: { type: 'boolean', alias: 'r', default: true, description: 'Whether or not to restore the backup on close' },
        glob: { type: 'string', alias: 'g', description: 'A glob to proxy to multiple directories at once' },
        ignoreDot: { type: 'boolean', alias: 'd', default: true, description: 'Whether or not to ignore directories prefixed with a \'.\'' },
        watch: { type: 'string', alias: 'w', description: 'A command to run when any source file changes'},
        watchDebounce: { type: 'number', alias: 't', default: 5000, description: 'An amount of time (in milliseconds) to wait after file updates before executing the \'watch\' command'},
        ignore: { type: 'string', alias: 'i', description: 'An ignore regex pattern, folders matching the pattern will not be watched, but will be proxied' }
    })
    .help()
    .normalize([
        'sourcePath', 
        'proxyLocation', 
        'backupLocation'
    ])
    .demandOption([
        'sourcePath', 
        'proxyLocation', 
        'backupLocation'
    ])
    .argv; 

configureExitHandler();

let { 
    proxyLocation, 
    sourcePath, 
    backupLocation
} = argv;

// handle trailing slashes
proxyLocation = proxyLocation.endsWith('/') 
    ? proxyLocation.substring(0, proxyLocation.length -1)
    : proxyLocation;
sourcePath = sourcePath.endsWith('/') 
    ? sourcePath.substring(0, sourcePath.length -1)
    : sourcePath;
backupLocation = backupLocation.endsWith('/') 
    ? backupLocation.substring(0, backupLocation.length -1)
    : backupLocation;

const { 
    glob, 
    watch, 
    watchDebounce,
    ignore, 
    ignoreDot,
    restore
} = argv;

const paths = glob 
    ? fileGlobService.getDirectoriesFromGlob(proxyLocation, backupLocation, glob) 
    : [{ proxy: proxyLocation, backup: backupLocation }];
let mustUnproxy = false;
(async function() { 
    console.log(`Proxying the following locations:\n${JSON.stringify(paths.map(path => path.proxy))}`);
    const { shouldContinue } = await prompt.get([{
        description: "continue (t or True for Yes, f or False for No)?",
        name: "shouldContinue",
        type: 'boolean',
        required: true
    }]);

    if(!shouldContinue) {
        exitHandler({ exit: true }, 0);
        return;
    }
    mustUnproxy = true;
    await Promise.all(paths.map(async path => {
        await proxyDirectoryService.backup(path.proxy, path.backup);
        await proxyDirectoryService.proxy(path.proxy, sourcePath);
    })).catch(reject => console.log(reject));

    if(watch) {
        subscriptions.push(new Observable<string>(
            subscribe => { 
                const watcher = chokidar.watch(argv.sourcePath, {
                    ignored:  ignore || ignoreDot ? /(^|[\/\\])\../ : null,
                    ignoreInitial: true,
                    persistent: true
                });
        
                watcher.on('all', (_, path) => subscribe.next(path));
                console.log(`watching ${argv.sourcePath} ...`);
                return function cleanup() { 
                    console.log('closing watcher');
                    watcher.close();
                }
            }
        ).pipe(
            tap(path => console.log(`${path} updated...`)),
            debounceTime(watchDebounce)
        )
        .subscribe({
            next: () => {
                console.log(`Executing ${watch}`);
                exec(watch, (error, output) => console.log(error || output));
            },
            error: error => console.log(error),
            complete: () => { 
                const error = 'shouldn\'t have completed';
                console.log(error)
                throw { error };
            }
        }));
    }
}());

// keep node running.
const interval = setInterval(() => {}, 1000);

//TODO: move this
function exitHandler(options: { cleanup?: boolean, exit?: boolean }, exitCode: number) {
    if (interval) 
        clearInterval(interval);

    (async function() { 
        if(mustUnproxy)
            await Promise.all(paths.map(async path => {
                await proxyDirectoryService.unproxy(path.proxy)
                if (restore)
                    await proxyDirectoryService.restore(path.proxy, path.backup);
            }));
        
        if (restore)
            await proxyDirectoryService.delete(backupLocation);

        subscriptions.forEach(subscription => subscription.unsubscribe());

        mustUnproxy = false;
        if (exitCode || exitCode === 0) 
            console.log(exitCode);
        if (options.exit) 
            process.exit();
    }());
}

function configureExitHandler() { 
    //do something when app is closing
    process.on('exit', exitHandler.bind(null,{cleanup:true}));
    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
    process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
}