import {styles} from 'ansi-colors';
import {mapObject} from 'augment-vir';

export const Color = mapObject(
    {
        Info: styles.blue,
        Fail: styles.red,
        Warn: styles.yellow,
        Success: styles.green,
        Reset: styles.reset,
        Bold: styles.bold,
    } as const,
    (key, value): string => {
        return value.open;
    },
);
