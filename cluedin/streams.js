"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("./utils"));
async function exportStreams(authToken, hostname, outputPath) {
    var pageNumber = 1;
    var total = 0;
    var count = 0;
    while (count <= total) {
        var result = await exportStreamsPage(pageNumber, authToken, hostname, outputPath);
        total = result.data.consume.streams.total;
        count += result.data.consume.streams.data.length;
        pageNumber = pageNumber + 1;
        if (count == total) {
            break;
        }
    }
}
async function exportStreamsPage(pageNumber, authToken, hostname, outputPath) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `query getStreams($pageNumber: Int) {
        consume {
            streams(pageNumber: $pageNumber) {
                total
                data {
                    name
                    isActive
                    condition
                    rules
                    rulesApplied
                    containerName
                    connectorProviderDefinitionId
                    mappingConfiguration
                    mode
                    exportOutgoingEdges
                    exportIncomingEdges
                }
            }
        }
    }`,
        variables: {
            pageNumber: pageNumber
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
        response.data.data.consume.streams.data.forEach((stream) => {
            utils_1.default.saveToDisk(outputPath, "Streams", stream.name, stream);
        });
        return response.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function importStreams(authToken, hostname, sourcePath) {
    const fs = require('fs');
    const directoryPath = sourcePath + 'Streams';
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan Streams directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(async function (file) {
            // Do whatever you want to do with the file
            await importStream(authToken, hostname, file.replace('.json', ''), sourcePath);
        });
    });
}
async function importStream(authToken, hostname, streamName, sourcePath) {
    let existingStream = await getStreamByName(authToken, hostname, streamName);
    var savedStream = await utils_1.default.readFile(sourcePath + 'Streams/' + streamName + '.json');
    if (existingStream == null || existingStream.id == null) {
        //create the rule
        console.log('Creating Stream');
        var createdStream = await createStream(authToken, hostname, existingStream);
        await updateStream(authToken, hostname, savedStream, createdStream.id);
        await setupConnectorStream(authToken, hostname, savedStream, createdStream.id);
        if (savedStream.isActive) {
            await activateStream(authToken, hostname, createdStream.id);
        }
    }
    else {
        //update the rule
        console.log('Updating Stream ' + existingStream.id);
        await updateStream(authToken, hostname, savedStream, existingStream.id);
        await setupConnectorStream(authToken, hostname, savedStream, createdStream.id);
        if (savedStream.isActive) {
            await activateStream(authToken, hostname, existingStream.id);
        }
    }
}
async function getStreamByName(authToken, hostname, streamName) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `query getStreamByName($name: String) {
      consume {
          streams(searchName: $name) {
              total
              data {
                  id
                  name
                  isActive
                  condition
                  rules
                  rulesApplied
                  containerName
                  connectorProviderDefinitionId
                  mappingConfiguration
                  mode
                  exportOutgoingEdges
                  exportIncomingEdges
              }
          }
      }
  }`,
        variables: {
            name: streamName
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
        return response.data.data.consume.streams.data.find(function (x) { return x.name == streamName; });
    })
        .catch((error) => {
        console.log(error);
    });
}
async function createStream(authToken, hostname, savedStream) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `mutation createStream($stream: InputCreateStream!) {
        consume {
          id
          createStream(stream: $stream) {
            id
          }
        }
      }`,
        variables: {
            rule: {
                name: savedStream.name,
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
        return response.data.data.consume.createStream;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function updateStream(authToken, hostname, savedStream, streamId) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `mutation saveStream($stream: InputStream!) {
        consume {
          id
          saveStream(stream: $stream) {
            id
          }
        }
      }`,
        variables: {
            stream: {
                id: streamId,
                name: savedStream.name,
                isActive: savedStream.isActive,
                condition: savedStream.condition,
                rules: savedStream.rules
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
        return response.data.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function setupConnectorStream(authToken, hostname, savedStream, streamId) {
    const axios = require('axios');
    var dataTypes = savedStream.mappingConfiguration.map(mapDataTypes);
    let data = JSON.stringify({
        query: `mutation setupConnectorStream($streamId: ID!, $exportConfiguration: InputExportConfiguration) {
        consume {
          id
          setupConnectorStream(
            streamId: $streamId
            exportConfiguration: $exportConfiguration
          ) {
            id
            name
          }
        }
      }`,
        variables: {
            streamId: streamId,
            exportConfiguration: {
                connectorProviderDefinitionId: savedStream.connectorProviderDefinitionId,
                containerName: savedStream.containerName,
                mode: savedStream.mode,
                exportOutgoingEdges: savedStream.exportOutgoingEdges,
                exportIncomingEdges: savedStream.exportIncomingEdges,
                dataTypes: dataTypes,
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
        return response.data.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
function mapDataTypes(item) {
    return { key: item.sourceDataType, type: item.sourceObjectType };
}
async function activateStream(authToken, hostname, streamId) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `mutation activateStream($streamId: ID!) {
        consume {
          id
          activateStream(streamId: $streamId) {
            id
            name
          }
        }
      }`,
        variables: {
            streamId: streamId
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
        return response.data.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
exports.default = { exportStreams, importStreams };
