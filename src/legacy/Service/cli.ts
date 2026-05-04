import { getCliArgs, type CliArgs } from '@/services/tauri-bridge';

export type { CliArgs };

/**
 * Fetch the CLI arguments that were passed when the app was launched.
 *
 * Returns an object with:
 *  - `dirs`               — Array of absolute directory paths to open on startup
 *  - `is_reveal`          — Whether the app was launched with the `--reveal` flag
 *  - `custom_style_sheet` — Parsed JSON of a custom theme file, if `--theme` was passed
 *
 * @example
 * const cli = await CLIInformations();
 * if (cli.dirs.length) {
 *     openDirectory(cli.dirs[0]);
 * }
 */
export default async function CLIInformations(): Promise<CliArgs> {
    return getCliArgs();
}

/**
 * Check whether the app was launched with a `--reveal` flag,
 * meaning the first directory argument should be highlighted/selected
 * rather than opened.
 */
export async function isRevealMode(): Promise<boolean> {
    const cli = await getCliArgs();
    return cli.is_reveal;
}

/**
 * Return the list of directories passed on the command line.
 * Empty array when the app was launched without any path arguments.
 */
export async function getStartupDirs(): Promise<string[]> {
    const cli = await getCliArgs();
    return cli.dirs;
}

/**
 * Return the custom stylesheet value passed via `--theme`, or `null` if none was given.
 */
export async function getCustomStyleSheet(): Promise<unknown | null> {
    const cli = await getCliArgs();
    return cli.custom_style_sheet ?? null;
}
