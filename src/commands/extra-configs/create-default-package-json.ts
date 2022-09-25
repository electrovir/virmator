import {getObjectTypedKeys, isObject} from 'augment-vir';
import {basename} from 'path';
import simpleGit, {SimpleGit} from 'simple-git';
import {jsonParseOrUndefined} from '../../augments/json';
import {formatCode} from '../../augments/prettier';

export async function createDefaultPackageJson(
    copyFromContents: string,
    existingConfigContents: string,
    repoDir: string,
): Promise<string> {
    const baseVirmatorPackageJson = JSON.parse(copyFromContents);
    if (!isObject(baseVirmatorPackageJson)) {
        throw new Error(`Failed to parse virmator's config version of package json file.`);
    }
    const currentRepoPackageJson = jsonParseOrUndefined(existingConfigContents) ?? {};
    if (!isObject(currentRepoPackageJson)) {
        throw new Error(`Failed to parse current repo's package json file.`);
    }

    const combinedScripts = combineScripts(
        baseVirmatorPackageJson as {scripts: Record<string, string>},
        currentRepoPackageJson as object,
    );

    const gitProperties = await getGitProperties(repoDir);

    const newPackageJson = {
        name: basename(repoDir),
        ...currentRepoPackageJson,
        ...baseVirmatorPackageJson,
        ...gitProperties,
        scripts: combinedScripts,
    };

    return await formatCode(JSON.stringify(newPackageJson), 'package.json');
}

function combineScripts(
    virmatorPackageJson: {scripts: Record<string, string>},
    currentRepoPackageJson: {scripts?: Record<string, string>},
): Record<string, string> {
    const scripts: Record<string, string> = {
        ...currentRepoPackageJson.scripts,
    };

    getObjectTypedKeys(virmatorPackageJson.scripts).forEach((key) => {
        const virmatorValue = virmatorPackageJson.scripts[key];
        const currentRepoValue = scripts[key];

        if (
            virmatorValue &&
            (!scripts.hasOwnProperty(key) ||
                (key === 'test' &&
                    currentRepoValue &&
                    currentRepoValue.includes('Error: no test specified')))
        ) {
            scripts[key] = virmatorValue;
        }
    });

    return scripts;
}

async function getGitProperties(
    repoDir: string,
): Promise<Partial<ReturnType<typeof createGitHubUrls>>> {
    const git: SimpleGit = simpleGit(repoDir);
    const remotes = await git.getRemotes(true);
    const originRemote = remotes.find((remote) => remote.name === 'origin') || remotes[0];
    if (originRemote && originRemote.refs.fetch.includes('github.com')) {
        return createGitHubUrls(originRemote.refs.fetch);
    } else {
        return {};
    }
}

function createGitHubUrls(ref: string) {
    const repoPath = ref.replace(/^.*github.com:/, '').replace(/\.git$/, '');
    const gitHubUrl = `https://github.com/${repoPath}`;
    const user = repoPath.replace(/\/[^\/]+$/, '');

    return {
        homepage: gitHubUrl,
        bugs: {
            url: `${gitHubUrl}/issues`,
        },
        repository: {
            type: 'git',
            url: gitHubUrl,
        },
        author: {
            name: user,
            url: `https://github.com/${user}`,
        },
    };
}
