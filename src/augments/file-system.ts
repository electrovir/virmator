import {ensureDir, existsSync, lstat, readlink, symlink, writeFile} from 'fs-extra';
import {dirname} from 'path';

export async function createSymLink(
    /**
     * Path that the symlink will link to. If relative, it will be linked relative to the symlink
     * location itself.
     */
    linkPath: string,
    /** The location and name the symlink file itself. */
    symlinkLocationPath: string,
): Promise<void> {
    if (existsSync(symlinkLocationPath)) {
        if (!(await lstat(symlinkLocationPath)).isSymbolicLink()) {
            throw new Error(
                `Tried to create symlink at ${symlinkLocationPath} but a non-symlink file already existed in that location.`,
            );
        }
        if ((await readlink(symlinkLocationPath)) !== linkPath) {
            throw new Error(
                `Symlink already exists at ${symlinkLocationPath} but has a differently link path.`,
            );
        }
    } else {
        await symlink(linkPath, symlinkLocationPath);
    }
}

export async function writeFileAndDir(
    path: string,
    contents: string | NodeJS.ArrayBufferView,
): Promise<void> {
    await ensureDir(dirname(path));
    await writeFile(path, contents);
}
