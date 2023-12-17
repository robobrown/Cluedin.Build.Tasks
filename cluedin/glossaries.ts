import utils from "./utils";

async function exportGlossaries(authToken: string, hostname: string, outputPath: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query getGlossaries {
      management {
          glossaryCategories {
              id
              name
              terms {
                  total
                  data {
                      id
                      name
                      active
                      shortDescription
                      certificationLevel
                      description
                      version
                      isObsolete
                      rating
                      userRating
                      ruleSet
                      isEndorsedByCurrentUser
                  }
              }
          }
      }
  }`,
    variables: {
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

    for (const glossaryCategory of response.data.data.management.glossaryCategories){
      utils.saveToDisk(outputPath, "Glossaries", glossaryCategory.name, glossaryCategory);
    }
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export default { exportGlossaries };

