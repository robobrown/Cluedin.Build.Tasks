import * as tl from "azure-pipelines-task-lib/task";
import {auth, entitytypes } from "../../../cluedin/module";

async function run() {
    try {

        const cluedinUsername: string = tl.getInputRequired('cluedinUsername');
        const cluedinPassword: string = tl.getInputRequired('cluedinPassword');
        const cluedinClientId: string = tl.getInputRequired('cluedinClientId');
        const cluedinHostname: string = tl.getInputRequired('cluedinHostname');
        const outputPath: string = tl.getInputRequired('outputPath');
        const entityTypeNames: string = tl.getInputRequired('entityTypeNames');
        
        const token = await auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        await entitytypes.exportEntityTypes(token, cluedinHostname, outputPath, entityTypeNames);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }
}

run().catch(console.error);