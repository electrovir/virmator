import {isTruthy} from 'augment-vir';
import {interpolationSafeWindowsPath, toPosixPath} from 'augment-vir/dist/cjs/node-only';
import {relative} from 'path';
import {Color} from '../cli-color';
import {
    BashCommandExecutorOutput,
    CommandExecutorInputs,
    isCompletedExecutor,
} from '../command/command-executor';
import {CommandDefinition} from '../command/define-command';
import {DefineCommandInputs} from '../command/define-command-inputs';
import {copyAllConfigFiles, CopyConfigOperation} from '../config/copy-config';
import {runVirmatorShellCommand} from './run-shell-command';

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

export async function runCommandExecutor<DefineCommandInputsGeneric extends DefineCommandInputs>(
    commandDefinition: CommandDefinition<DefineCommandInputsGeneric>,
    commandInputs: CommandExecutorInputs<DefineCommandInputsGeneric>,
): Promise<boolean> {
    console.info(`${Color.Info}running ${commandDefinition.commandName}...${Color.Reset}`);

    await copyAllConfigFiles({
        logging: commandInputs.logging,
        configFiles: Object.values(commandDefinition.configFiles),
        operation: CopyConfigOperation.Init,
        packageDir: commandInputs.packageDir,
        repoDir: commandInputs.repoDir,
    });
    const executorOutput = await commandDefinition.executor(commandInputs);
    if (isCompletedExecutor(executorOutput)) {
        return executorOutput.success;
    } else {
        const commandString = createCommandString(executorOutput);
        console.log(
            `${Color.Faint}${toPosixPath(relative(process.cwd(), commandString))}${Color.Reset}`,
        );
        const commandResult = await runVirmatorShellCommand(commandString, {
            repoDir: commandInputs.repoDir,
            logging: commandInputs.logging,
            logTransforms: executorOutput.logTransforms,
        });

        return commandResult.exitCode === 0;
    }
}
