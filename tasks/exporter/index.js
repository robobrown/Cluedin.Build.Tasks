"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("azure-pipelines-task-lib/task");
const module_1 = require("../../cluedin/module");
async function run() {
    try {
        const cluedinUsername = tl.getInputRequired('cluedinUsername');
        const cluedinPassword = tl.getInputRequired('cluedinPassword');
        const cluedinClientId = tl.getInputRequired('cluedinClientId');
        const cluedinHostname = tl.getInputRequired('cluedinHostname');
        const outputPath = tl.getInputRequired('outputPath');
        const token = await module_1.auth.getToken(cluedinUsername, cluedinPassword, cluedinClientId, cluedinHostname);
        await module_1.cluedin.exportAll(token, cluedinHostname, outputPath);
    }
    catch (err) {
        if (err instanceof Error) {
            tl.setResult(tl.TaskResult.Failed, err.message);
        }
    }
}
run();
