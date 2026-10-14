import type {Config} from 'pull-request-vir';

/**
 * Read straight from `process.env` because the action imports this file without installing this
 * repo's dependencies, so runtime imports would fail.
 */
const repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
if (!repoOwner) {
    throw new Error('Missing GITHUB_REPOSITORY_OWNER env var.');
}

export const config: Config = {
    assignToAuthor: true,
    blockNoMerge: true,
    ignoreDraft: true,
    reviewRules: [
        {
            autoAdd: true,
            users: [
                repoOwner,
            ],
            required: 1,
            userOverrides: {
                [repoOwner]: {
                    required: 0,
                },
            },
        },
    ],
};
