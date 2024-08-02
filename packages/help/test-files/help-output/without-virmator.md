## Available commands

-   **compile**

    Type checks TypeScript files and compiles them into JS outputs using the TypeScript compiler. Any extra args are passed directly to tsc.

    Automatically compiles a mono-repo's sub packages in the correct order if called from a mono-repo root.

    -   `virmator compile`
    -   With tsc flags: `virmator compile --noEmit`
