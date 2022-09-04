import {isTruthy} from 'augment-vir';
import {interpolationSafeWindowsPath} from 'augment-vir/dist/cjs/node-only';
import {runVirmatorShellCommand} from '../../cli-old/cli-command/run-shell-command';
import {Color} from '../cli-color';
import {
    BashCommandExecutorOutput,
    CommandExecutorInputs,
    isCompletedExecutor,
} from './command-executor';
import {CommandDefinition} from './define-command';

export function createCommandString(executorOutput: BashCommandExecutorOutput): string {
    const args = executorOutput.args.map((arg) => {
        if (typeof arg !== 'string') {
            if (arg.skipWindowsInterpolation) {
                return arg;
            } else {
                arg = arg.arg;
            }
        }

        return interpolationSafeWindowsPath(arg);
    });
    const commandString = `${executorOutput.mainCommand} ${args.filter(isTruthy).join(' ')}`;

    return commandString;
}

export async function runCommandExecutor(
    commandDefinition: CommandDefinition,
    commandInputs: CommandExecutorInputs<any>,
): Promise<boolean> {
    const executorOutput = await commandDefinition.executor(commandInputs);
    if (isCompletedExecutor(executorOutput)) {
        return executorOutput.success;
    } else {
        const commandString = createCommandString(executorOutput);
        console.log(`${Color.Faint}${commandString}${Color.Reset}`);
        const commandResult = await runVirmatorShellCommand(commandString, {
            repoDir: commandInputs.repoDir,
            logging: commandInputs.logging,
            logTransforms: executorOutput.logTransforms,
        });

        return commandResult.exitCode === 0;
    }
}
