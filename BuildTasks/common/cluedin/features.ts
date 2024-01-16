import utils from "./utils";
  
export async function setFeatureStatus(authToken: string, hostname: string, featureName: string, isEnabled: boolean){
  const axios = require('axios');
  const data = JSON.stringify({
      query: `mutation enableOrganizationFeatures($name: String!, $isEnabled: Boolean) {
        administration {
            id
            enableOrganizationFeatures(name: $name, isEnabled: $isEnabled) {
                id
            }
        }
    }
    `,
      variables: {
        name: featureName,
        isEnabled: isEnabled
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

    axios.request(config)
    .then((response: any) => {
        if (response.data.errors != null && response.data.errors.length > 0){
          throw new Error(response.data.errors[0].message);
        }
    })
    .catch((error: Error) => {
      console.log(error);
      throw error;
    });
}

export default { setFeatureStatus };