import utils from "./utils";
  
export async function exportConnectors(authToken: string, hostname: string, outputPath: string){
  const axios = require('axios');
  const data = JSON.stringify({
      query: `query getAllConnectors {
        inbound {
            connectorConfigurations {
                total
                configurations {
                  id
                  name
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
    .then(async (response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
          console.log(JSON.stringify(response.data.errors));
          throw new Error(response.data.errors[0].message);
        }
        for (const connector of response.data.data.inbound.connectorConfigurations.configurations){
            const connectorInfo = await getConnectorById(authToken, hostname, connector.id);
            utils.saveToDisk(outputPath, "Connectors", connectorInfo.name, connectorInfo)
        }
    })
    .catch((error: Error) => {
      throw error;
    });
}

export async function importConnectors(authToken: string, hostname: string, sourcePath: string){
  const fs = require('fs');
  const directoryPath = sourcePath + 'Connectors';

  if (!fs.existsSync(directoryPath)){
    return;
  }

  const files = await fs.readdirSync(directoryPath);
  for (const file of files) {
    if (file.endsWith('.json') == false) continue;
    await importConnector(authToken, hostname, file.replace('.json', ''), sourcePath);
  }
}

export async function setConnectorConfigValue(authToken: string, hostname: string, connectorName: string, connectorConfigName: string, connectorConfigValue: string){
  const existingConnector = await getConnectorByName(authToken, hostname, connectorName);
  const helperConfiguration = existingConnector.helperConfiguration;
  
  Object.keys(helperConfiguration).forEach(function(key) {
    if (key == connectorConfigName)
    {
      helperConfiguration[key] = connectorConfigValue;
    }
  });

  const axios = require('axios');
  const data = JSON.stringify({
    query: `mutation saveConnectorConfiguration(
      $connectorConfiguration: InputConnectorConfiguration
    ) {
      inbound {
        saveConnectorConfiguration(
          connectorConfiguration: $connectorConfiguration
        ) {
          id
          helperConfiguration
        }
      }
    }`,
    variables: {
      connectorConfiguration: {
        id: existingConnector.id,
        name: existingConnector.name,
        accountDisplay: existingConnector.accountDisplay,
        accountId: existingConnector.accountId,
        active: existingConnector.active,
        autoSync: existingConnector.autoSync,
        codeName: existingConnector.codeName,
        configuration: existingConnector.configuration,
        createdDate: existingConnector.createdDate,
        entityId: existingConnector.entityId,
        failingAuthentication: existingConnector.failingAuthentication, // Keep the existing configuration as set in the environment
        guide: existingConnector.guide,
        helperConfiguration: helperConfiguration, //This is the new update configuration
        providerId: existingConnector.providerId,
        reAuthEndpoint: existingConnector.reAuthEndpoint,
        source: existingConnector.source,
        sourceQuality: existingConnector.sourceQuality,
        stats: existingConnector.stats,
        supportsAutomaticWebhookCreation: existingConnector.supportsAutomaticWebhookCreation,
        supportsConfiguration: existingConnector.supportsConfiguration,
        supportsWebhooks: existingConnector.supportsWebhooks,
        userId: existingConnector.userId,
        userName: existingConnector.userName,
        webhookManagementEndpoints: existingConnector.webhookManagementEndpoints,
        webhooks: existingConnector.webhooks
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
        console.log(JSON.stringify(response.data.errors));
        throw new Error(response.data.errors[0].message);
      }
      return response.data.data;
  })
  .catch((error: Error) => {
    throw error;
  });
}

export async function getConnectorByName(authToken: string, hostname: string, connectorName: string){
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
        console.log(JSON.stringify(response.data.errors));
        throw new Error(response.data.errors[0].message);
       }
       const connector = response.data.data.inbound.connectorConfigurations.configurations.find(function(x: any) { return x.name == connectorName; });
       if (connector == null) {
        console.log('Connector not found: ' + connectorName);
        return null;
       }

       return getConnectorById(authToken, hostname, connector.id);
  })
  .catch((error: Error) => {
    throw error;
  });
}

async function importConnector(authToken: string, hostname: string, connectorName: string, sourcePath: string){
  console.log('Importing Connector ' + connectorName);
  const existingItem = await getConnectorByName(authToken, hostname, connectorName);
  const savedItem = utils.readFile(sourcePath + '/Connectors/' + connectorName + '.json');

  if (existingItem == null || existingItem.id == null) {
      //create the connector
      await createConnector(authToken, hostname, savedItem);
  }
  else {
      //update the connector
      await updateConnector(authToken, hostname, savedItem, existingItem);
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
      authInfo: savedConnector.helperConfiguration
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
        console.log(JSON.stringify(response.data.errors));
        throw new Error(response.data.errors[0].message);
      }
      return response.data.data;
  })
  .catch((error: Error) => {
    throw error;
  });
}

async function updateConnector(authToken: string, hostname: string, savedConnector: any, existingConnector: any){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `mutation saveConnectorConfiguration(
      $connectorConfiguration: InputConnectorConfiguration
    ) {
      inbound {
        saveConnectorConfiguration(
          connectorConfiguration: $connectorConfiguration
        ) {
          id
          helperConfiguration
        }
      }
    }`,
    variables: {
      connectorConfiguration: {
        id: existingConnector.id,
        name: savedConnector.name,
        accountDisplay: savedConnector.accountDisplay,
        accountId: savedConnector.accountId,
        active: savedConnector.active,
        autoSync: savedConnector.autoSync,
        codeName: savedConnector.codeName,
        configuration: existingConnector.configuration,
        createdDate: existingConnector.createdDate,
        entityId: existingConnector.entityId,
        failingAuthentication: existingConnector.failingAuthentication, // Keep the existing configuration as set in the environment
        guide: savedConnector.guide,
        helperConfiguration: existingConnector.helperConfiguration, // Keep the existing configuration as set in the environment
        providerId: savedConnector.providerId,
        reAuthEndpoint: savedConnector.reAuthEndpoint,
        source: savedConnector.source,
        sourceQuality: existingConnector.sourceQuality,
        stats: existingConnector.stats,
        supportsAutomaticWebhookCreation: savedConnector.supportsAutomaticWebhookCreation,
        supportsConfiguration: savedConnector.supportsConfiguration,
        supportsWebhooks: savedConnector.supportsWebhooks,
        userId: existingConnector.userId,
        userName: existingConnector.userName,
        webhookManagementEndpoints: savedConnector.webhookManagementEndpoints,
        webhooks: savedConnector.webhooks
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
        console.log(JSON.stringify(response.data.errors));
        throw new Error(response.data.errors[0].message);
      }
      return response.data.data;
  })
  .catch((error: Error) => {
    throw error;
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
            active
            autoSync
            codeName
            streamModes
            configuration
            failingAuthentication
            guide
            helperConfiguration
            isUnApproved
            providerId
            reAuthEndpoint
            source
            sourceQuality
            supportsAutomaticWebhookCreation
            supportsConfiguration
            supportsWebhooks
            webhookManagementEndpoints
            webhooks
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
        console.log(JSON.stringify(response.data.errors));
        throw new Error(response.data.errors[0].message);
       }
       return response.data.data.inbound.connectorConfiguration;
  })
  .catch((error: Error) => {
    throw error;
  });
}

export default { exportConnectors, importConnectors, getConnectorByName, setConnectorConfigValue };