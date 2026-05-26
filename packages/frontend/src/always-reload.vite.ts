import {logColors} from '@augment-vir/common';
import {existsSync, lstatSync, readlinkSync} from 'node:fs';
import {relative} from 'node:path';
import {type LogOptions, type PluginOption} from 'vite';

/**
 * Include actual paths and symlinked target paths if they exist.
 *
 * This is needed because when removing files from the watcher, sym links have be removed with the
 * path to the symlink itself AND the path to the symlink target or the path will still be watched.
 */
function mapToActualPaths(paths: Readonly<string[]>): Readonly<string[]> {
    return paths.reduce((accum: string[], path) => {
        if (existsSync(path)) {
            if (lstatSync(path).isSymbolicLink()) {
                console.info('reading symlink from', path);
                // sym links AND the original path both need to be included
                return accum.concat(readlinkSync(path), path);
            } else {
                return accum.concat(path);
            }
        } else {
            return accum;
        }
    }, []);
}

/**
 * There are similar plugins out there that try to do this but they aren't aggressive enough. This
 * plugin literally always reloads on save, no questions asked.
 */
export function alwaysReloadPlugin(
    config: Partial<{
        exclusions: string[];
        /** Inclusions apply after exclusions so they will override exclusions. */
        inclusions: string[];
    }> = {},
): PluginOption {
    return {
        name: 'alwaysReloadPlugin',
        apply: 'serve',
        config: () => ({
            server: {
                watch: {
                    disableGlobbing: false,
                },
            },
        }),
        handleHotUpdate() {
            return [];
        },
        configureServer(server) {
            const {inclusions = [], exclusions = []} = config;
            let callingAlready = false;

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const oldInfoLog = server.config.logger.info;

            function customInfoLog(message: string, options: LogOptions) {
                /**
                 * Ignore vite's built-in extra page reload logging as this will duplicate our
                 * messages.
                 */
                if (message.startsWith('page reload')) {
                    return;
                }
                oldInfoLog(message, options);
            }
            server.config.logger.info = customInfoLog;

            function reloadCallback(path: string) {
                // prevent duplicate calls cause the watcher is very eager to call callbacks multiple times in a row
                if (!callingAlready) {
                    callingAlready = true;
                    server.ws.send({
                        type: 'full-reload',
                        path: '*',
                    });
                    const resolvedUrls = [
                        ...(server.resolvedUrls?.local ?? []),
                        ...(server.resolvedUrls?.network ?? []),
                    ].join(' ');
                    const urlsSuffix = resolvedUrls ? ` ${resolvedUrls}` : '';
                    server.config.logger.info(
                        `${logColors.success}page reload ${logColors.faint}${relative(
                            process.cwd(),
                            path,
                        )}${urlsSuffix}${logColors.reset}`,
                        {
                            clear: true,
                            timestamp: true,
                        },
                    );
                    /**
                     * Debounce reloads calls so that they don't get spammed. If you're actually
                     * intentionally saving faster than this, then what the heck are you doing?
                     */
                    setTimeout(() => {
                        callingAlready = false;
                    }, 100);
                }
            }

            server.watcher.add(server.config.root);

            if (exclusions.length) {
                server.watcher.unwatch(mapToActualPaths(exclusions));
            }
            // ignore macOS file system metadata stuff
            server.watcher.unwatch('./**/.DS_Store');
            if (inclusions.length) {
                server.watcher.add(mapToActualPaths(inclusions));
            }
            if (server.config.publicDir) {
                server.watcher.add(server.config.publicDir);
            }

            if (!server.watcher.listeners('change').includes(reloadCallback)) {
                server.watcher.on('change', reloadCallback);
                server.watcher.on('add', reloadCallback);
                server.watcher.on('unlink', reloadCallback);
            }
        },
    };
}
