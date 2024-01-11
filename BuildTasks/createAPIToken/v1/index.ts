import * as tl from "azure-pipelines-task-lib";
import {auth } from "../../common/cluedin/module";

async function run() {
    try {

        const cluedinUsername: string = tl.getInputRequired('cluedinUsername');
        const cluedinPassword: string = tl.getInputRequired('cluedinPassword');
        const cluedinClientId: string = tl.getInputRequired('cluedinClientId');
        const cluedinHostname: string = tl.getInputRequired('cluedinHostname');
        const tokenName: string = tl.getInputRequired('tokenName');
        const tokenExpiryHours: string = tl.getPathInputRequired('tokenExpiryHours');
        
        const token = await auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        let theToken: any = await auth.createToken(token, cluedinHostname, tokenName, parseInt(tokenExpiryHours));
        tl.setVariable('theToken', theToken.accessToken);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }
}

run().catch(console.error);