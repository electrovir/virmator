import * as styles from 'ansi-styles';

export const Color = {
    Info: styles.blue.open,
    Fail: styles.red.open,
    Warn: styles.yellow.open,
    Success: styles.green.open,
    Reset: styles.reset.close,
    Bold: styles.bold.open,
} as const;
