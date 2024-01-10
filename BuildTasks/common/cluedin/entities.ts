import auth from './auth'

export async function deleteEntities(authToken: string, hostname: string, entityType: string, filter: string, pageSize: number){
    if (filter == null || filter == "" || filter == "*") {
      return deleteAllEntities(authToken, hostname, entityType, pageSize)
    } else {
      return deleteAllEntitiesWithFilter(authToken, hostname, entityType, filter, pageSize);
    }
}

export async function deleteAllEntities(authToken: string, hostname: string, entityType: string, pageSize: number){
  //NB apparently there is a limit of 10 000 on GQL for deletions, this code may need to loop 
  let total = 0;
  let count = 0;
 
   while (count <= total){
    const result = await deleteAllEntities_internal(authToken, hostname, entityType, pageSize);
    
    total = result.search.totalResults;
    count += result.search.entries.length;
    if (count == total)
    { 
      break;
    }
   }
}

async function deleteAllEntities_internal(authToken: string, hostname: string, entityType: string, pageSize: number) {
  const axios = require('axios');
  const data = JSON.stringify({
      query: `query deleteAllEntitiesFromSpecificType($entityType: String, $pageSize: Int) {
        search(query: $entityType, pageSize: $pageSize) {
          totalResults
          actions {
            deleteEntity
          }
        }
      }
      `,
      variables: {
          entityType: "entityType:" + entityType,
          pageSize: pageSize
      }
    });
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://' + hostname + '/api/api/graphql', //Sends to a different graphql endpoint
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
      throw error;
    }); 
}

export async function deleteAllEntitiesWithFilter(authToken: string, hostname: string, entityType: string, filter: string, pageSize: number){
  //NB apparently there is a limit of 10 000 on GQL for deletions, this code may need to loop 
  let total = 0;
  let count = 0;
 
   while (count <= total){
    const result = await deleteAllEntitiesWithFilter_internal(authToken, hostname, entityType, filter, pageSize);
    
    total = result.search.totalResults;
    count += result.search.entries.length;
    if (count == total)
    { 
      break;
    }
   }
}

async function deleteAllEntitiesWithFilter_internal(authToken: string, hostname: string, entityType: string, filter: string, pageSize: number){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `query deleteAllEntitiesFromSpecificType($entityType: String, $filter: String, $pageSize: Int) {
      search(query: $entityType, filter: $filter, pageSize: $pageSize) {
        totalResults
        actions {
          deleteEntity
        }
      }
    }
    `,
    variables: {
        entityType: "entityType:" + entityType,
        filter: filter,
        pageSize: pageSize
    }
  });
  
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://' + hostname + '/api/api/graphql', //Sends to a different graphql endpoint
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
    throw error;
  }); 
}

export async function reprocessAllRules(authToken: string, hostname: string){
  const axios = require('axios');
  const userInfo = await auth.getUserInfo(authToken, hostname);
  if (!userInfo.roles.includes("Admin")){
    throw new Error("User is not an admin, add the user to the Admin Role on the CluedIn Database");
  }

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://' + hostname + '/api/api/admin/commands/process/all?organizationId=' + userInfo.organizationId + '&minSize=0',
    headers: { 
      'Authorization': 'Bearer ' + authToken
    }
  };

  console.log(config.url);
  axios.request(config)
  .then((response: any) => {
    return response.data.data;
  })
  .catch((error: Error) => {
    // for this one ignore the error
  });
}

export async function reprocessRulesByEntityType(authToken: string, hostname: string, entityType: string){
  const axios = require('axios');
  const userInfo = await auth.getUserInfo(authToken, hostname);
  if (!userInfo.roles.includes("Admin")){
    throw new Error("User is not an admin, add the user to the Admin Role on the CluedIn Database");
  }

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://' + hostname + '/api/api/admin/commands/process/all/entityType?organizationId=' + userInfo.organizationId + '&entityType=' + entityType + '&minSize=0',
    headers: { 
      'Authorization': 'Bearer ' + authToken
    }
  };
console.log(config.url);

  axios.request(config)
  .then((response: any) => {
    return response.data.data;
  })
  .catch((error: Error) => {
    // for this one ignore the error
  });
}

export async function resyncDatastores(authToken: string, hostname: string){
  const axios = require('axios');
  const userInfo = await auth.getUserInfo(authToken, hostname);
  if (!userInfo.roles.includes("Admin")){
    throw new Error("User is not an admin, add the user to the Admin Role on the CluedIn Database");
  }

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://' + hostname + '/api/api/admin/commands/resync/datastores/all?organizationId=' + userInfo.organizationId,
    headers: { 
      'Authorization': 'Bearer ' + authToken
    }
  };
console.log(config.url);

  axios.request(config)
  .then((response: any) => {
    return response.data.data;
  })
  .catch((error: Error) => {
    // for this one ignore the error
  });
}

export default { deleteEntities, reprocessAllRules, reprocessRulesByEntityType, resyncDatastores };

