export type CliHelpSection = Readonly<{
    title: string;
    content: string;
}>;

export type CliCommandDescription = Readonly<{
    sections: Readonly<CliHelpSection[]>;
    examples: Readonly<CliHelpSection[]>;
}>;
