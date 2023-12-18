import utils from "./utils";

async function exportEntityTypes(authToken: string, hostname: string, outputPath: string, entityTypeNames: string){
  if (entityTypeNames != null && entityTypeNames != "*"){
    for(const entityType of entityTypeNames.split(',')){
        var entityTypeDetails = await getEntityTypeByName(authToken, hostname, entityType);
        if (entityTypeDetails == null){
            throw new Error('EntityTypes not found: ' + entityType);
        }
        utils.saveToDisk(outputPath, "EntityTypes", entityType, entityTypeDetails)
    }
  }
  else if (entityTypeNames == "*") {
    throw new Error('EntityTypes export all not supported');
  }
}
 
async function getEntityTypeByName(authToken: string, hostname: string, entityName: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query entityTypeLayoutConfigurations(
        $searchName: String
        $pageNumber: Int
        $pageSize: Int
    ) {
        management {
            entityTypeConfigurations(
                searchName: $searchName
                pageNumber: $pageNumber
                pageSize: $pageSize
            ) {
                data {
                    active
                    displayName
                    entityType
                    icon
                    id
                    layoutConfiguration
                    pageTemplateId
                    path
                    route
                    template
                    type
                    pageTemplate {
                        displayName
                        name
                        pageTemplateId
                    }
                }
                total
            }
        }
    }
    
  `,
    variables: {
      pageNumber: 1,
      pageSize: 20,
      searchName: entityName
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
    data : data
  };

  return axios.request(config)
  .then((response: any) => {
    if (response.data.errors != null && response.data.errors.length > 0){
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.management.entityTypeConfigurations.data.find(function(x: any) { return x.displayName == entityName; });
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function importEntityTypes(authToken: string, hostname: string, sourcePath: string) {
  const fs = require('fs');
  const directoryPath = sourcePath + 'EntityTypes';

  fs.readdir(directoryPath, async function (err: string, files: string[]) {
      //handling error
      if (err) {
          return console.log('Unable to scan EntityTypes directory: ' + err);
      } 
    
      for (const file of files) {
        await importEntityTypeConfiguration(authToken, hostname, file.replace('.json', ''), sourcePath);
      }
  });
}

async function importEntityTypeConfiguration(authToken: string, hostname: string, entityTypeName: string, sourcePath: string){
  console.log('Importing Entity Type Configuration ' + entityTypeName);
  var existingItem = await getEntityTypeByName(authToken, hostname, entityTypeName);
  var savedItem = utils.readFile(sourcePath + 'EntityTypes/' + entityTypeName + '.json');

  if (existingItem == null || existingItem.id == null) {
      console.log('Creating Entity type Configuration');
      await createEntityTypeConfiguration(authToken, hostname, savedItem);
      existingItem = await getEntityTypeByName(authToken, hostname, entityTypeName);
  }

  var areEqual = utils.isEqual(existingItem, savedItem); 
  if (!areEqual) {
    console.log('Updating Entity Type Configuration ' + savedItem.displayName);
    await updateEntityTypeConfiguration(authToken, hostname, savedItem, existingItem.id);
  }
}

async function createEntityTypeConfiguration(authToken: string, hostname: string, entitytype: any){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation saveEntityTypeConfiguration(
      $entityTypeConfiguration: InputEntityTypeLayoutConfiguration!
  ) {
      management {
          id
          saveEntityTypeConfiguration(entityTypeConfiguration: $entityTypeConfiguration) {
              id
          }
      }
  }
  `,
    variables: {
      "entityTypeConfiguration": {
            "displayName": entitytype.displayName,
            "icon": entitytype.icon,
            "route": entitytype.route,
            "path": entitytype.path,
            "entityType": entitytype.entityType,
            "type": entitytype.type,
            "template": entitytype.template,
            "layoutConfiguration": entitytype.layoutConfiguration,
            "pageTemplateId": entitytype.pageTemplateId,
            "active": entitytype.active
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

async function updateEntityTypeConfiguration(authToken: string, hostname: string, savedEntityTypeConfiguration: any, entitytypeConfigurationId: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation saveEntityTypeConfiguration(
      $entityTypeConfiguration: InputEntityTypeLayoutConfiguration!
  ) {
      management {
          id
          saveEntityTypeConfiguration(entityTypeConfiguration: $entityTypeConfiguration) {
              id
          }
      }
  }
  `,
    variables: {
      "entityTypeConfiguration": {
            "id": entitytypeConfigurationId,
            "displayName": savedEntityTypeConfiguration.displayName,
            "icon": savedEntityTypeConfiguration.icon,
            "route": savedEntityTypeConfiguration.route,
            "path": savedEntityTypeConfiguration.path,
            "entityType": savedEntityTypeConfiguration.entityType,
            "type": savedEntityTypeConfiguration.type,
            "template": savedEntityTypeConfiguration.template,
            "layoutConfiguration": savedEntityTypeConfiguration.layoutConfiguration,
            "pageTemplateId": savedEntityTypeConfiguration.pageTemplateId,
            "active": savedEntityTypeConfiguration.active
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


export default { exportEntityTypes, importEntityTypes };

