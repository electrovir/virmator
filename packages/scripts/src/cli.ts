import {extractErrorMessage} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import mri from 'mri';
import {checkPluginReadmes, writePluginReadmes} from './generate-plugin-readmes';
import {checkVirmatorReadme, writeVirmatorReadme} from './generate-virmator-readmes';

async function cli() {
    const args = mri(process.argv);

    if (args._.includes('check')) {
        await checkPluginReadmes();
        await checkVirmatorReadme();
    } else {
        await writePluginReadmes();
        await writeVirmatorReadme();
    }
}

cli().catch((error: unknown) => {
    log.error(extractErrorMessage(error));
    process.exit(1);
});
