"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rules_1 = __importDefault(require("./rules"));
async function exportAll(authToken, hostname, outputPath) {
    console.log("Exporting data from Cluedin");
    // await connector.exportConnectors(authToken, hostname, outputPath);
    // await datasources.exportDataSources(authToken, hostname, outputPath);
    await rules_1.default.exportRules(authToken, hostname, outputPath);
    // await streams.exportStreams(authToken, hostname, outputPath);
    console.log("Export complete");
}
async function importAll(authToken, hostname, outputPath) {
    console.log("Importing data into Cluedin");
    // await connector.importConnectors(authToken, hostname, outputPath);
    await rules_1.default.importRules(authToken, hostname, outputPath);
    // await streams.importStreams(authToken, hostname, outputPath);
    // await datasources.importDataSources(authToken, hostname, outputPath);
    console.log("Importing complete");
}
exports.default = { exportAll, importAll };
