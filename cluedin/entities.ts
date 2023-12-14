
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
            actions {
              deleteEntity
            }
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
        return response.data;
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
          actions {
            deleteEntity
          }
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
      return response.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });    
}

export default { deleteEntities };