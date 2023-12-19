import utils from "./utils";

export async function exportStreams(authToken: string, hostname: string, outputPath: string){
    let pageNumber = 1;
    let total = 0;
    let count = 0;
   
     while (count <= total){
      const result = await getStreamsByPage(pageNumber, authToken, hostname);
       
      for (const stream of result.data){
        utils.saveToDisk(outputPath, "Streams", stream.name, stream)
      }

      total = result.total;
      count += result.data.length;
      pageNumber = pageNumber + 1;
      if (count == total)
      { 
        break;
      }
    }
  }
  
  async function getStreamsByPage(pageNumber: number, authToken: string, hostname: string){
    const axios = require('axios');
    const data = JSON.stringify({
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
     
     const config = {
       method: 'post',
       maxBodyLength: Infinity,
       url: 'https://' + hostname + '/graphql',
       headers: { 
         'Content-Type': 'application/json', 
         'Authorization': 'Bearer ' + authToken
       },
       data : data
     };
  
     return axios.request(config)
     .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
          throw new Error(response.data.errors[0].message);
        }
        
        return response.data.data.consume.streams;
     })
     .catch((error: Error) => {
       console.log(error);
     });
  }
  
  export async function importStreams(authToken: string, hostname: string, sourcePath: string){
    const fs = require('fs');
    const directoryPath = sourcePath + 'Streams';

    fs.readdir(directoryPath, async function (err: string, files: string[]) {
        //handling error
        if (err) {
            return console.log('Unable to scan Streams directory: ' + err);
        } 
      
        for (const file of files) {
          await importStream(authToken, hostname, file.replace('.json', ''), sourcePath);
        }
    });
  }

  async function importStream(authToken: string, hostname: string, streamName: string, sourcePath: string){
    let existingStream = await getStreamByName(authToken, hostname, streamName);
    const savedStream = utils.readFile(sourcePath + 'Streams/' + streamName + '.json');

    if (existingStream == null || existingStream.id == null) {
        console.log('Creating Stream');
        await createStream(authToken, hostname, existingStream);
        existingStream = await getStreamByName(authToken, hostname, streamName);
    }

    const areEqual = utils.isEqual(existingStream, savedStream); 
    if (!areEqual) {
      console.log('Updating Stream ' + existingStream.id);
      await updateStream(authToken, hostname, savedStream, existingStream.id);
      await setupConnectorStream(authToken, hostname, savedStream, existingStream.id);
      if (savedStream.isActive)
      {
          await activateStream(authToken, hostname, existingStream.id);
      }
    }
  }

  async function getStreamByName(authToken: string, hostname: string, streamName: string){
    const axios = require('axios');
    const data = JSON.stringify({
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
  
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://' + hostname + '/graphql',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'Bearer ' + authToken
    },
    data : data
  };

  return axios.request(config)
  .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.consume.streams.data.find(function(x: any) { return x.name == streamName; });
  })
  .catch((error: Error) => {
    console.log(error);
  });
  }

  async function createStream(authToken: string, hostname: string, savedStream: any){
    const axios = require('axios');
    const data = JSON.stringify({
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
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://' + hostname + '/graphql',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + authToken
      },
      data : data
    };

    return axios.request(config)
    .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.consume.createStream;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

  async function updateStream(authToken: string, hostname: string, savedStream: any, streamId: string){
    const axios = require('axios');
    const data = JSON.stringify({
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
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://' + hostname + '/graphql',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + authToken
      },
      data : data
    };

    return axios.request(config)
    .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

  async function setupConnectorStream(authToken: string, hostname: string, savedStream: any, streamId: string){
    const axios = require('axios');
    const dataTypes = savedStream.mappingConfiguration.map(mapDataTypes);
              
    const data = JSON.stringify({
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
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://' + hostname + '/graphql',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + authToken
      },
      data : data
    };

    return axios.request(config)
    .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

  function mapDataTypes (item:any){
    return { key: item.sourceDataType, type: item.sourceObjectType };
  }

  async function activateStream(authToken: string, hostname: string, streamId: string){
    const axios = require('axios');
    const data = JSON.stringify({
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
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://' + hostname + '/graphql',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + authToken
      },
      data : data
    };

    return axios.request(config)
    .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

  export async function deleteStreamsByName(authToken: string, hostname: string, streamNames: string){
    const streamIds:string[] = [];

    if (streamNames == "*"){
      let pageNumber = 1;
      let total = 0;
      let count = 0;
    
      while (count <= total){
        const result = await getStreamsByPage(pageNumber, authToken, hostname);

        for (const stream of result.data){
          streamIds.push(stream.id);
        }

        total = result.total;
        count += result.data.length;
        pageNumber = pageNumber + 1;
        if (count == total)
        { 
          break;
        }
      }
    }
    else {
      for (const streamName of streamNames.split(',')) {
        const stream = await getStreamByName(authToken, hostname, streamName);
        if (stream != null && stream.id != null) {
          streamIds.push(stream.id);
        }
      }
    }

    await deleteStreamsById(authToken, hostname, streamIds);
  }

  async function deleteStreamsById(authToken: string, hostname: string, streamIds: string[]){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation deleteStreams($streamIds: [ID]) {
        consume {
          deleteStreams(streamIds: $streamIds)
        }
    }`,
      variables: {
        streamIds: streamIds
      }
    });
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://' + hostname + '/graphql',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + authToken
      },
      data : data
    };

    return axios.request(config)
    .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

export default { exportStreams, importStreams, deleteStreamsByName };