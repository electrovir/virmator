export type CliHelpSection = Readonly<{
    title: string;
    content: string;
}>;

export type CliCommandDescription = Readonly<{
    sections: CliHelpSection[];
    examples: CliHelpSection[];
}>;
