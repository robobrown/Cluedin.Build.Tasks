import tl = require('azure-pipelines-task-lib/task');
import {auth, vocabularies } from "../../cluedin/module";

async function run() {
    try {

        const cluedinUsername: string = tl.getInputRequired('cluedinUsername');
        const cluedinPassword: string = tl.getInputRequired('cluedinPassword');
        const cluedinClientId: string = tl.getInputRequired('cluedinClientId');
        const cluedinHostname: string = tl.getInputRequired('cluedinHostname');
        const outputPath: string = tl.getInputRequired('outputPath');
        const vocabularyNames: string = tl.getInputRequired('vocabularyNames');
        const includeCluedInCore: boolean = tl.getBoolInput('includeCluedInCore');

        const token = await auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        await vocabularies.exportVocabularies(token, cluedinHostname, outputPath, vocabularyNames, includeCluedInCore);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }
}

run();