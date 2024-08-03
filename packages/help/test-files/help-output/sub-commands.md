# virmator usage

`[npx] virmator [--flags] command subCommand [...optional args]`

-   `npx` is needed when the command is run directly from the terminal (not called from within an npm script) unless virmator has been globally installed (which I recommend against).
-   `[--flags]` is any of the optional virmator flags. See Virmator Flags below.
-   `command`, `subCommand`, and `[...optional args]` depend on the specific command you're running. See Available Commands below.

## Available commands

-   **example1**

    This command does stuff.

    Actually this command does nothing.

    -   Examples
        -   Example 1: `virmator example1`
        -   `virmator example1`
    -   Sub Commands

        -   **nested1**

            This command does stuff.

            Actually this command does nothing.

            -   Examples
                -   Nested 1: `virmator example1 nested1`
                -   `virmator example1 nested1`
            -   Sub Commands

                -   **nested2**

                    This command does stuff.

                    Actually this command does nothing.

                    -   Examples
                        -   Nested 2: `virmator example1 nested1 nested2`
                        -   `virmator example1 nested1 nested2`

-   **example2**

    This command does stuff.

    Actually this command does nothing.

    -   Examples
        -   Example 2: `virmator example2`
        -   `virmator example2`

## Virmator Flags

All virmator flags are optional and typically not needed.

-   **--no-configs**: Prevents command config files from being copied.
-   **--no-deps**: Prevents command npm deps from being installed.
-   **--help**: Print the help message.
