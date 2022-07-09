import {VirmatorCliError} from './virmator-cli.error';

export class VirmatorConfigFileError extends VirmatorCliError {
    public override readonly name = 'VirmatorConfigFileError';
}
