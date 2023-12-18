import auth from './auth'

async function deleteEntities(authToken: string, hostname: string, entityType: string, filter: string, pageSize: number){
    if (filter == null || filter == "" || filter == "*") {
      return deleteAllEntities(authToken, hostname, entityType, pageSize)
    } else {
      return deleteAllEntitiesWithFilter(authToken, hostname, entityType, filter, pageSize);
    }
}

async function deleteAllEntities(authToken: string, hostname: string, entityType: string, pageSize: number){
    const axios = require('axios');
    let data = JSON.stringify({
      query: `query deleteAllEntitiesFromSpecificType($entityType: String, $pageSize: Int) {
        search(query: $entityType, pageSize: $pageSize) {
          totalResults
          entries {
id
          }
        }
      }
      `,
      variables: {
          entityType: "entityType:" + entityType,
          pageSize: pageSize
      }
    });
    
    let config = {
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
    });    
}

async function deleteAllEntitiesWithFilter(authToken: string, hostname: string, entityType: string, filter: string, pageSize: number){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query deleteAllEntitiesFromSpecificType($entityType: String, $filter: String, $pageSize: Int) {
      search(query: $entityType, filter: $filter, pageSize: $pageSize) {
        totalResults
        entries {
id
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
  
  let config = {
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
  });    
}

async function reprocessAllRules(authToken: string, hostname: string){
  var userInfo = await auth.getUserInfo(authToken, hostname);
  if (!userInfo.roles.includes("Admin")){
    throw new Error("User is not an admin, add the user to the Admin Role on the CluedIn Database");
  }

  const axios = require('axios');

  let config = {
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
    // console.log(JSON.stringify(response.data));
    return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });

}

async function reprocessRulesByEntityType(authToken: string, hostname: string, entityType: string){
  var userInfo = await auth.getUserInfo(authToken, hostname);
  if (!userInfo.roles.includes("Admin")){
    throw new Error("User is not an admin, add the user to the Admin Role on the CluedIn Database");
  }

  const axios = require('axios');

  let config = {
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
    // console.log(JSON.stringify(response.data));
    return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function resyncDatastores(authToken: string, hostname: string){
  var userInfo = await auth.getUserInfo(authToken, hostname);
  if (!userInfo.roles.includes("Admin")){
    throw new Error("User is not an admin, add the user to the Admin Role on the CluedIn Database");
  }

  const axios = require('axios');

  let config = {
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
    console.log(error);
  });

}

export default { deleteEntities, reprocessAllRules, reprocessRulesByEntityType, resyncDatastores };