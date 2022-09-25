import {isObject} from 'augment-vir';
import {UpdateConfigCallback} from '../../api/config/config-file-definition';
import {deeplyCombineObjects} from '../../augments/object';

export function combineJsonConfig(
    ...[
        newConfigContents,
        existingConfigContents,
    ]: Parameters<UpdateConfigCallback>
): ReturnType<UpdateConfigCallback> {
    let oldJson;
    try {
        oldJson = JSON.parse(existingConfigContents);
    } catch (error) {}
    const newJson = JSON.parse(newConfigContents);
    if (!oldJson || !isObject(oldJson)) {
        return JSON.stringify(newJson);
    }
    return JSON.stringify(deeplyCombineObjects(oldJson, newJson));
}
