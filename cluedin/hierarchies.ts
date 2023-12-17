import utils from "./utils";

async function exportHierarchies(authToken: string, hostname: string, outputPath: string){
    var pageNumber = 1;
    var total = 0;
    var count = 0;
   
     while (count <= total){
       var result = await getHierarchiesByPage(authToken, hostname, pageNumber);

       for (const hierarchie of result.data.management.hierarchies.data){
            utils.saveToDisk(outputPath, "Hierarchies", hierarchie.hierarchieName, hierarchie)
       };

       total = result.data.management.hierarchies.total;
       count += result.data.management.hierarchies.data.length;
       pageNumber = pageNumber + 1;
       if (count == total)
       { 
         break;
       }
    }
 }

async function getHierarchiesByPage(authToken: string, hostname: string, pageNumber: number){
  const axios = require('axios');
  let data = JSON.stringify({
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
     return response.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export default { exportHierarchies };

