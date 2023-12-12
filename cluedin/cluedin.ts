import connector from './connector'
import datasources from './datasources'
import rules from './rules'
import streams from './streams'

async function exportAll(authToken: string, hostname: string, outputPath: string){
    console.log("Exporting data from Cluedin");
    // await connector.exportConnectors(authToken, hostname, outputPath);
    // await datasources.exportDataSources(authToken, hostname, outputPath);
    await rules.exportRules(authToken, hostname, outputPath);
    // await streams.exportStreams(authToken, hostname, outputPath);
    console.log("Export complete");
}

async function importAll(authToken: string, hostname: string, outputPath: string){
    console.log("Importing data into Cluedin");
    // await connector.importConnectors(authToken, hostname, outputPath);
    await rules.importRules(authToken, hostname, outputPath);
    // await streams.importStreams(authToken, hostname, outputPath);
    // await datasources.importDataSources(authToken, hostname, outputPath);
    console.log("Importing complete");
}

export default { exportAll, importAll };