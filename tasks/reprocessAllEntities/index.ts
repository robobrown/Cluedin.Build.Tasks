import tl = require('azure-pipelines-task-lib/task');
import { auth, entities } from "../../cluedin/module";

async function run() {
    try {

        const cluedinUsername: string = tl.getInputRequired('cluedinUsername');
        const cluedinPassword: string = tl.getInputRequired('cluedinPassword');
        const cluedinClientId: string = tl.getInputRequired('cluedinClientId');
        const cluedinHostname: string = tl.getInputRequired('cluedinHostname');

        const token = await auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        await entities.reprocessAllRules(token, cluedinHostname);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }
}

run();