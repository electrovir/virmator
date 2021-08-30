/** These config files are not used by any virmator commands but they are still helpful. */
export enum BareConfigKey {
    GitAttributes = 'GitAttributes',
    GitHubActionsTest = 'GitHubActionsTest',
    GitIgnore = 'GitIgnore',
    NpmIgnore = 'NpmIgnore',
    PrettierIgnore = 'PrettierIgnore',
    VsCodeSettings = 'VsCodeSettings',
}

/** These are config files used by virmator commands. */
export enum CommandConfigKey {
    Cspell = 'Cspell',
    Prettier = 'Prettier',
    TsConfig = 'TsConfig',
    PackageJson = 'PackageJson',
}

export const ConfigKey = {...CommandConfigKey, ...BareConfigKey};
export type ConfigKey = CommandConfigKey | BareConfigKey;
