# Megacles

Proxy a directory to another and trigger script when the source directory changes. 

## Getting Started

Install using `npm -i megacles -g`

### Prerequisites

You'll need to be running > node 12

### Usage

Run using `megacles -s sourcepath -p proxypath -b backuppath` to proxy the source directory so it also appears under the proxy directory. `backuppath` with be used to backup the contents of `proxypath`, which will then be restored when the command is cancelled.

All options can be listed using `megacles --help`

```
Options:
      --version         Show version number                            [boolean]
  -s, --sourcePath      The path you want proxied elsewhere  [string] [required]
  -p, --proxyLocation   The location to proxy the original source
                                                             [string] [required]
  -b, --backupLocation  The location to backup the existing proxy folder'
                        contents                             [string] [required]
  -r, --restore         Whether or not to restore the backup on close
                                                       [boolean] [default: true]
  -g, --glob            A glob to proxy to multiple directories at once [string]
  -d, --ignoreDot       Whether or not to ignore directories prefixed with a '.'
                                                       [boolean] [default: true]
  -w, --watch           A command to run when any source file changes   [string]
  -t, --watchDebounce   An amount of time (in milliseconds) to wait after file
                        updates before executing the 'watch' command
                                                        [number] [default: 5000]
  -i, --ignore          An ignore regex pattern, folders matching the pattern
                        will not be watched, but will be proxied        [string]
      --help            Show help                                      [boolean]
```

## Running the tests

`npm test` should build the project and execute it using the source and proxy folders in the `./test` directory.