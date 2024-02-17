import * as tl from "azure-pipelines-task-lib";
import {auth, connector } from "../../common/cluedin/module";

async function run() {
    try {

        const cluedinUsername: string = tl.getInputRequired('cluedinUsername');
        const cluedinPassword: string = tl.getInputRequired('cluedinPassword');
        const cluedinClientId: string = tl.getInputRequired('cluedinClientId');
        const cluedinHostname: string = tl.getInputRequired('cluedinHostname');
        const connectorName: string = tl.getInputRequired('connectorName');
        const configName: string = tl.getInputRequired('configName');
        const configValue: string = tl.getInputRequired('configValue');
        
        const token = await auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        await connector.setConnectorConfigValue(token, cluedinHostname, connectorName, configName, configValue);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
            console.error(err);
        }
    }
}

run().catch(console.error);