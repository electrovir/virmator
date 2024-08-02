# virmator usage

`[npx] virmator [--flags] command subCommand [...optional args]`

-   `npx` is needed when the command is run directly from the terminal (not called from within an npm script) unless virmator has been globally installed (which I recommend against).
-   `[--flags]` is any of the optional virmator flags. See Virmator Flags below.
-   `command`, `subCommand`, and `[...optional args]` depend on the specific command you're running. See Available Commands below.

## Available commands

-   **compile**

    Type checks TypeScript files and compiles them into JS outputs using the TypeScript compiler. Any extra args are passed directly to tsc.

    Automatically compiles a mono-repo's sub packages in the correct order if called from a mono-repo root.

    -   `virmator compile`
    -   With tsc flags: `virmator compile --noEmit`

## Virmator Flags

All virmator flags are optional and typically not needed.

-   **--no-configs**: Prevents command config files from being copied.
-   **--no-deps**: Prevents command npm deps from being installed.
