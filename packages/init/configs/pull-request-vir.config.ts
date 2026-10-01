import type {Config} from 'pull-request-vir';

export const config: Config = {
    assignToAuthor: true,
    blockNoMerge: true,
    ignoreDraft: true,
    reviewRules: [
        {
            autoAdd: true,
            users: [
                'electrovir',
            ],
            required: 1,
            userOverrides: {
                electrovir: {
                    required: 0,
                },
            },
        },
    ],
};
