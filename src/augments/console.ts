import {createInterface} from 'readline';

export async function askQuestion(questionToAsk: string, timeoutMs = 60_000): Promise<string> {
    const cliInterface = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        cliInterface.question(questionToAsk + ' ', (response) => {
            cliInterface.close();
            resolve(response);
        });

        setTimeout(() => {
            cliInterface.close();
            reject(`Took too long to response (over "${timeoutMs / 1_000}" seconds)`);
        }, timeoutMs);
    });
}

export async function askQuestionUntilConditionMet({
    questionToAsk,
    conditionCallback,
    invalidInputMessage,
    tryCountMax = 5,
}: {
    questionToAsk: string;
    conditionCallback: (response: string) => boolean | Promise<boolean>;
    invalidInputMessage: string;
    tryCountMax?: number;
}): Promise<string> {
    let wasConditionMet = false;
    let retryCount = 0;
    let response = '';
    while (!wasConditionMet && retryCount <= tryCountMax) {
        response = (await askQuestion(questionToAsk)).trim();
        wasConditionMet = await conditionCallback(response);
        if (!wasConditionMet) {
            console.error(invalidInputMessage);
        }
        retryCount++;
    }
    if (retryCount > tryCountMax) {
        throw new Error(`Max input attempts (${tryCountMax}) exceeded.`);
    }
    return response;
}
