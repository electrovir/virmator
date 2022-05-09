export type CliHelpSection = Readonly<{
    title: string;
    content: string;
}>;

export type CliHelpDescription = Readonly<{
    sections: CliHelpSection[];
    examples: CliHelpSection[];
}>;
