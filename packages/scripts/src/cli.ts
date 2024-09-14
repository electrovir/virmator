import {extractErrorMessage, log} from '@augment-vir/common';
import mri from 'mri';
import {checkPluginReadmes, writePluginReadmes} from './generate-plugin-readmes.js';
import {checkVirmatorReadme, writeVirmatorReadme} from './generate-virmator-readmes.js';

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
