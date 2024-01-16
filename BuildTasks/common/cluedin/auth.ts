export async function getToken(username: string, password: string, client_id: string, cluedinHostname: string){
  const axios = require('axios');
  const qs = require('qs');

  const data = qs.stringify({
  'username': username,
  'password': password,
  'client_id': client_id,
  'grant_type': 'password' 
  });
  
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://' + cluedinHostname + '/auth/connect/token',
    headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    data : data
  };
    
  return axios.request(config)
  .then((response: { data: any; }) => {
    return response.data.access_token;
  })
  .catch((error: Error) => {
      console.log(error);
      throw error;
  });
}

export async function getUserInfo(authToken: string, hostname: string){
  const axios = require('axios');
  const data = JSON.stringify({
      query: `query Administration {
        administration {
            me {
              client
            }
        }
    }`,
      variables: {
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
      return response.data.data.administration.me.client;
  })
  .catch((error: Error) => {
      console.log(error);
      throw error;
  });
}

export async function createToken(authToken: string, hostname: string, tokenName: string, tokenExpiryHours: number){
  const existingToken = await getTokenByName(authToken, hostname, tokenName);
  if (existingToken != null) return; // token already exists

  const axios = require('axios');
  const data = JSON.stringify({
      query: `mutation createToken($token: ApiTokenInput!) {
        administration {
          createToken(token: $token) {
            name
            accessToken
            id
          }
        }
      }`,
      variables: {
        token: {
          name: tokenName,
          expiredInHours: tokenExpiryHours
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
  .then(async (response: any) => {
      if (response.data.errors != null && response.data.errors.length > 0){
          throw new Error(response.data.errors[0].message);
      }
      // return response.data.data.administration.createToken; //BUG, the CluedIn Token does not return
      const theToken = await getTokenByName(authToken, hostname, tokenName);
      return theToken;
  })
  .catch((error: Error) => {
      console.log(error);
      throw error;
  });
}

export async function getTokenByName(authToken: string, hostname: string, tokenName: string){
  const axios = require('axios');
  const data = JSON.stringify({
      query: `query getApiTokens {
        administration {
          id
          apiTokens {
            name
            accessToken
            id
            expiryDate
            expiresInDays
          }
        }
      }`,
      variables: {
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
      return response.data.data.administration.apiTokens.find(function(x: any) { return x.name == tokenName; });
  })
  .catch((error: Error) => {
      console.log(error);
      throw error;
  });
}

export default { getToken, getUserInfo, createToken };