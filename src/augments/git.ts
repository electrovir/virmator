import {runShellCommand} from 'augment-vir/dist/cjs/node-only';

export async function doChangesExist(repoDirPath: string): Promise<boolean> {
    const getChangesCommand = `git status --porcelain=v1 2>/dev/null`;
    const getChangesOutput = await runShellCommand(getChangesCommand, {
        cwd: repoDirPath,
        rejectOnError: true,
    });

    return !!getChangesOutput.stdout;
}
