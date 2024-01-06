import utils from "./utils";

export async function exportHierarchies(authToken: string, hostname: string, outputPath: string){
    let pageNumber = 1;
    let total = 0;
    let count = 0;
   
     while (count <= total){
      const result = await getHierarchiesByPage(authToken, hostname, pageNumber);

       for (const hierarchie of result.data){
            utils.saveToDisk(outputPath, "Hierarchies", hierarchie.hierarchieName, hierarchie)
       }

       total = result.total;
       count += result.data.length;
       pageNumber = pageNumber + 1;
       if (count == total)
       { 
         break;
       }
    }
 }

async function getHierarchiesByPage(authToken: string, hostname: string, pageNumber: number){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `query getHierachies {
      management {
          hierarchies {
              total
              data {
                  id
                  name
                  entityType
                  relationships
                  status
                  numberOfNodes
              }
          }
      }
  }
  
  `,
    variables: {
      pageNumber: pageNumber
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
     return response.data.data.management.hierarchies;
  })
  .catch((error: Error) => {
    console.log(error);
    throw error;
  });
}

export async function importHierarchies(authToken: string, hostname: string, outputPath: string){
  throw new Error("Not implemented");
}

export default { exportHierarchies, importHierarchies };

