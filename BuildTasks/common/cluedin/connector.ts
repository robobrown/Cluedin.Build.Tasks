import utils from "./utils";
  
export async function exportConnectors(authToken: string, hostname: string, outputPath: string){
  const axios = require('axios');
  const data = JSON.stringify({
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

    axios.request(config)
    .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
          throw new Error(response.data.errors[0].message);
        }
        for (const connector of response.data.data.inbound.connectorConfigurations.configurations){
            utils.saveToDisk(outputPath, "Connectors", connector.name, connector)
        }
    })
    .catch((error: Error) => {
      console.log(error);
    });
}

export async function importConnectors(authToken: string, hostname: string, sourcePath: string){
  const fs = require('fs/promises');
  const directoryPath = sourcePath + 'Connectors';

  const files = await fs.readdir(directoryPath);
  for (const file of files) {
    if (file.endsWith('.json') == false) continue;
    await importConnector(authToken, hostname, file.replace('.json', ''), sourcePath);
  }
}

async function importConnector(authToken: string, hostname: string, connectorName: string, sourcePath: string){
  console.log('Importing Connector ' + connectorName);
  const existingItem = await getConnectorByName(authToken, hostname, connectorName);
  const savedItem = utils.readFile(sourcePath + '/Connectors/' + connectorName + '.json');

  if (existingItem == null || existingItem.id == null) {
      //create the connector
      console.log('Creating connector: ' + connectorName);
      await createConnector(authToken, hostname, savedItem);
  }
  else {
      // console.log('Updating connector: ' + connectorName);
      // console.warn('Updating connectors is not yet supported');
  }
  
}

async function createConnector(authToken: string, hostname: string, savedConnector: any){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data.consume.createStream.id;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getConnectorByName(authToken: string, hostname: string, connectorName: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
       const connector = response.data.data.inbound.connectorConfigurations.configurations.find(function(x: any) { return x.name == connectorName; });
       return getConnectorById(authToken, hostname, connector.id);
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getConnectorById(authToken: string, hostname: string, connectorId: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
       return response.data.data.inbound.connectorConfiguration;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export default { exportConnectors, importConnectors };