"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("./utils"));
async function exportConnectors(authToken, hostname, outputPath) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `query getAllConnectors {
        inbound {
            connectorConfigurations {
                total
                configurations {
                    name
                    accountDisplay
                    accountId
                    active
                    autoSync
                    codeName
                    streamModes
                    entityId
                    failingAuthentication
                    providerId
                    source
                    sourceQuality
                    status
                    supportsAutomaticWebhookCreation
                    supportsConfiguration
                    supportsWebhooks
                }
            }
        }
    }`,
        variables: {}
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        response.data.data.inbound.connectorConfigurations.configurations.forEach((connector) => {
            utils_1.default.saveToDisk(outputPath, "Connectors", connector.name, connector);
        });
    })
        .catch((error) => {
        console.log(error);
    });
}
async function importConnectors(authToken, hostname, sourcePath) {
    const fs = require('fs');
    const directoryPath = sourcePath + 'Connectors';
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan Connectors directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(async function (file) {
            // Do whatever you want to do with the file
            await importConnector(authToken, hostname, file.replace('.json', ''), sourcePath);
        });
    });
}
async function importConnector(authToken, hostname, connectorName, sourcePath) {
    let existingItem = await getConnectorByName(authToken, hostname, connectorName);
    var savedItem = await utils_1.default.readFile(sourcePath + '/Connectors/' + connectorName + '.json');
    if (existingItem == null || existingItem.id == null) {
        //create the connector
        console.log('Creating connector: ' + connectorName);
        await createConnector(authToken, hostname, savedItem);
    }
    else {
        console.log('Updating connector: ' + connectorName);
        console.warn('Updating connectors is not yet supported');
    }
}
async function createConnector(authToken, hostname, savedConnector) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `mutation createConnection($connectorId: ID, $authInfo: JSON) {
      inbound {
        createConnection(connectorId: $connectorId, authInfo: $authInfo) {
          id
        }
      }
    }`,
        variables: {
            connectorId: savedConnector.providerId,
            authInfo: {
                name: savedConnector.name
            }
        }
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.consume.createStream.id;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function getConnectorByName(authToken, hostname, connectorName) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `query getAllConnectors($name: String) {
      inbound {
          connectorConfigurations(searchName: $name) {
              total
              configurations {
                  id
                  name
              }
          }
      }
  }`,
        variables: {
            name: connectorName
        }
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        var connector = response.data.data.inbound.connectorConfigurations.configurations.find(function (x) { return x.name == connectorName; });
        return getConnectorById(authToken, hostname, connector.id);
    })
        .catch((error) => {
        console.log(error);
    });
}
async function getConnectorById(authToken, hostname, connectorId) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `query getConnectorById($connectorId: ID!) {
      inbound {
          connectorConfiguration(id: $connectorId) {
              id
              name
              accountDisplay
              accountId
              autoSync
              codeName
              streamModes
              configuration
              createdDate
              entityId
              failingAuthentication
              providerId
              source
              sourceQuality
              supportsAutomaticWebhookCreation
              supportsConfiguration
              supportsWebhooks
              userId
              userName
          }
      }
  }`,
        variables: {
            connectorId: connectorId
        }
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.connectorConfiguration;
    })
        .catch((error) => {
        console.log(error);
    });
}
exports.default = { exportConnectors, importConnectors };
