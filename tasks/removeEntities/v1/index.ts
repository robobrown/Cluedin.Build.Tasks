import * as tl from "azure-pipelines-task-lib/task";
import { auth, entities } from "../../../cluedin/module";

async function run() {
    try {

        const cluedinUsername: string = tl.getInputRequired('cluedinUsername');
        const cluedinPassword: string = tl.getInputRequired('cluedinPassword');
        const cluedinClientId: string = tl.getInputRequired('cluedinClientId');
        const cluedinHostname: string = tl.getInputRequired('cluedinHostname');
        const entityType: string = tl.getInputRequired('entityType');
        const filter: string = tl.getInputRequired('filter');
        const pageSize: number = parseInt(tl.getInputRequired('pageSize'));

        const token = await auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        await entities.deleteEntities(token, cluedinHostname, entityType, filter, pageSize);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }
}

run().catch(console.error);