import * as tl from "azure-pipelines-task-lib/task";
import {auth, entitytypes } from "../../common/cluedin/module";

async function run() {
    try {

        const cluedinUsername: string = tl.getInputRequired('cluedinUsername');
        const cluedinPassword: string = tl.getInputRequired('cluedinPassword');
        const cluedinClientId: string = tl.getInputRequired('cluedinClientId');
        const cluedinHostname: string = tl.getInputRequired('cluedinHostname');
        const sourcePath: string = tl.getInputRequired('sourcePath');

        const token = await auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        await entitytypes.importEntityTypes(token, cluedinHostname, sourcePath);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
            console.error(err);
        }
    }
}

run().catch(console.error);