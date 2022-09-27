import {isObject} from 'augment-vir';
import {UpdateConfigCallback} from '../../api/config/config-file-definition';
import {deeplyCombineObjects} from '../../augments/object';
import {formatCode} from '../../augments/prettier';

export async function combineJsonConfig(
    ...[
        newConfigContents,
        existingConfigContents,
    ]: Parameters<UpdateConfigCallback>
): Promise<string> {
    let oldJson;
    try {
        oldJson = JSON.parse(existingConfigContents);
    } catch (error) {}
    const newJson = JSON.parse(newConfigContents);
    if (!oldJson || !isObject(oldJson)) {
        return stringify(newJson);
    }
    return stringify(deeplyCombineObjects(oldJson, newJson));
}

async function stringify(input: any): Promise<string> {
    return await formatCode(JSON.stringify(input, null, 4), 'a.json');
}
