import {existsSync, lstat, readlink, symlink} from 'fs-extra';

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
        await symlink(
            linkPath,
            symlinkLocationPath,
            // use junction to fix permission issues on windows
            'junction',
        );
    }
}
