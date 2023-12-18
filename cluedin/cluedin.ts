import connector from './connector'
import datasources from './datasources'
import rules from './rules'
import streams from './streams'
import vocabularies from './vocabularies'
import hierarchies from './hierarchies'
import glossaries from './glossaries'

async function exportAll(authToken: string, hostname: string, outputPath: string){
    console.log("Exporting data from CluedIn");
    await connector.exportConnectors(authToken, hostname, outputPath);
    await datasources.exportDataSources(authToken, hostname, outputPath);
    await rules.exportRules(authToken, hostname, outputPath);
    await streams.exportStreams(authToken, hostname, outputPath);
    await vocabularies.exportVocabularies(authToken, hostname, outputPath, "*", false);
    await hierarchies.exportHierarchies(authToken, hostname, outputPath);
    await glossaries.exportGlossaries(authToken, hostname, outputPath);
    console.log("Export complete");
}

async function importAll(authToken: string, hostname: string, outputPath: string){
    console.log("Importing data into CluedIn");
    await connector.importConnectors(authToken, hostname, outputPath);
    await rules.importRules(authToken, hostname, outputPath);
    await streams.importStreams(authToken, hostname, outputPath);
    await datasources.importDataSources(authToken, hostname, outputPath);
    await glossaries.importGlossaries(authToken, hostname, outputPath);
    console.log("Importing complete");
}

export default { exportAll, importAll };