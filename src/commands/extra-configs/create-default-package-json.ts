import {getObjectTypedKeys, isObject} from '@augment-vir/common';
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
): Promise<Partial<ReturnType<typeof createGitUrls>>> {
    const git: SimpleGit = simpleGit(repoDir);
    const remotes = await git.getRemotes(true);
    const originRemote = remotes.find((remote) => remote.name === 'origin') || remotes[0];
    if (originRemote) {
        return createGitUrls(originRemote.refs.fetch);
    } else {
        return {};
    }
}

function createGitUrls(ref: string) {
    const repoPath = ref
        .replace(/(\w):(\w)/g, '$1/$2')
        .replace(/\.git$/, '')
        .replace(/^git@/g, 'https://');
    const isGitHub = repoPath.includes('github.com');
    const issuesUrl = isGitHub ? `${repoPath}/issues` : '';
    const username = repoPath.replace(/^.+\.com\//, '').replace(/\/.+$/, '');
    const bugsObject = issuesUrl ? {bugs: {url: issuesUrl}} : {};
    const userUrlObject = isGitHub
        ? {
              url: `https://github.com/${username}`,
          }
        : {};

    return {
        homepage: repoPath,
        ...bugsObject,
        repository: {
            type: 'git',
            url: repoPath,
        },
        author: {
            name: username,
            ...userUrlObject,
        },
    };
}
