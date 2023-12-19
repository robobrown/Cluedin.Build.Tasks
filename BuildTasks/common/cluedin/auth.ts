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
  });
}

export default { getToken, getUserInfo };