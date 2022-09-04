export type HelpSection = Readonly<{
    title: string;
    content: string;
}>;

export type CommandDescription = Readonly<{
    sections: Readonly<HelpSection[]>;
    examples: Readonly<HelpSection[]>;
}>;
