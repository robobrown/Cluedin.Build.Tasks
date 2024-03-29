import * as tl from "azure-pipelines-task-lib/task";
import {auth, streams } from "../../common/cluedin/module";

async function run() {
    try {

        const cluedinUsername: string = tl.getInputRequired('cluedinUsername');
        const cluedinPassword: string = tl.getInputRequired('cluedinPassword');
        const cluedinClientId: string = tl.getInputRequired('cluedinClientId');
        const cluedinHostname: string = tl.getInputRequired('cluedinHostname');
        const outputPath: string = tl.getInputRequired('outputPath');

        const token = await auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        await streams.exportStreams(token, cluedinHostname, outputPath);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
            console.error(err);
        }
    }
}

run().catch(console.error);