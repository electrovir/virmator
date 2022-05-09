/** These config files are not used by any virmator commands but they are still helpful. */
export enum BareConfigKey {
    GitAttributes = 'GitAttributes',

    GitHubActionsTaggedRelease = 'GitHubActionsTaggedRelease',
    GitHubActionsTests = 'GitHubActionsTests',
    GitHubActionsGhPages = 'GitHubActionsGhPages',

    GitIgnore = 'GitIgnore',
    NpmIgnore = 'NpmIgnore',
    VsCodeSettings = 'VsCodeSettings',
}

/** These are config files used by specific virmator commands. */
export enum CommandConfigKey {
    Cspell = 'Cspell',
    PackageJson = 'PackageJson',
    Prettier = 'Prettier',
    PrettierIgnore = 'PrettierIgnore',
    TsConfig = 'TsConfig',
}

export const ConfigKey = {...CommandConfigKey, ...BareConfigKey};
export type ConfigKey = CommandConfigKey | BareConfigKey;
