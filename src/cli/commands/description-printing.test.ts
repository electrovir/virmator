import {getIndent, wrapLines} from './description-printing';

describe(wrapLines.name, () => {
    it('should wrap lines', () => {
        expect(
            wrapLines(
                `Hello there well what have we here?
    This is gonna be a really long line so it intentionally wraps at least several times onto new lines.
            `,
                50,
            ),
        ).toBe(`Hello there well what have we here?
    This is gonna be a really long line so it
    intentionally wraps at least several times
    onto new lines.`);
    });

    it('should create new lines if indentation does not match', () => {
        expect(
            wrapLines(
                `Hello there well what have we here?
    This is gonna be a really long line so it intentionally wraps at least several times onto new lines.
        And now a new line with different indentation! This one will also need to wrap.
        This is the same indentation so it should end up wrapping with the previous line.
            `,
                50,
            ),
        ).toBe(`Hello there well what have we here?
    This is gonna be a really long line so it
    intentionally wraps at least several times
    onto new lines.
        And now a new line with different
        indentation! This one will also need to
        wrap. This is the same indentation so it
        should end up wrapping with the previous
        line.`);
    });

    fit('should wrap around a perfectly cut sentence properly', () => {
        expect(
            wrapLines(
                `        Insert code snippets into markdown files. This uses the markdown-code-example-inserter package to expand code link comments inside of markdown files to actual markdown code blocks. See that package's README for more details but the basics are that you need a comment that looks like the following in your markdown file for this to do anything: \`<!-- example-link: path/to/file.ts -->\``,
                80,
            ),
        ).toBe(
            `        Insert code snippets into markdown files. This uses the
        markdown-code-example-inserter package to expand code link comments
        inside of markdown files to actual markdown code blocks. See that
        package's README for more details but the basics are that you need a
        comment that looks like the following in your markdown file for this to
        do anything: \`<!-- example-link: path/to/file.ts -->\``,
        );
    });
});

describe(getIndent.name, () => {
    it('should extract proper indentation', () => {
        expect(getIndent('hello there')).toBe('');
        expect(getIndent('hello there     ')).toBe('');
        expect(getIndent('hello        there')).toBe('');
        expect(getIndent('hello        there         ')).toBe('');
        expect(getIndent('    hello there')).toBe('    ');
        expect(getIndent('\thello there')).toBe('\t');
        expect(getIndent('    hello     there    ')).toBe('    ');
        expect(getIndent('    helloThere    ')).toBe('    ');
        expect(getIndent('\t    helloThere    ')).toBe('\t    ');
        expect(getIndent('    hello     there    \n what\n    fff')).toBe('    ');
    });
});
