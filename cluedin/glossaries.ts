import utils from "./utils";

export async function exportGlossaries(authToken: string, hostname: string, outputPath: string){
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
  .then(async (response: any) => {
    if (response.data.errors != null && response.data.errors.length > 0){
      throw new Error(response.data.errors[0].message);
    }

    for (const glossaryCategory of response.data.data.management.glossaryCategories){
      //HACK, because the cluedin API is not returning the data of the term we have to get the info by ID.
      //Logged with Cluedin Support Ticket number #2192565630
      const arrayData: any[] = [];
      for (var term of glossaryCategory.terms.data) {
          var fullTerm: any = await getGlossaryTermById(authToken, hostname, term.id);
          arrayData.push(fullTerm);
      }
      
      glossaryCategory.terms.data = arrayData;

      utils.saveToDisk(outputPath, "Glossaries", glossaryCategory.name, glossaryCategory);
    }
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export async function importGlossaries(authToken: string, hostname: string, sourcePath: string){
  const fs = require('fs');
  const directoryPath = sourcePath + 'Glossaries';

  fs.readdir(directoryPath, async function (err: string, files: string[]) {
      //handling error
      if (err) {
          return console.log('Unable to scan Glossaries directory: ' + err);
      } 

      for (const file of files) {
        await importGloassary(authToken, hostname, file.replace('.json', ''), sourcePath);
      }
  });
}

async function importGloassary(authToken: string, hostname: string, gloassaryName: string, sourcePath: string){
  let existingItem = await getGloassaryCategoryByName(authToken, hostname, gloassaryName);
  var savedItem = utils.readFile(sourcePath + '/Glossaries/' + gloassaryName + '.json');

  if (existingItem == null || existingItem.id == null) {
    //create the gloassary
    console.log('Creating gloassary: ' + gloassaryName);
    await createGloassary(authToken, hostname, savedItem);
    existingItem = await getGloassaryCategoryByName(authToken, hostname, gloassaryName);
  }
  
  //Create Terms that don't exist
  for (const term of savedItem.terms.data){
    if (existingItem.terms.data.find((x: any) => x.name == term.name) == null){
      await createGloassaryTerm(authToken, hostname, term, existingItem.id);
      existingItem = await getGloassaryCategoryByName(authToken, hostname, gloassaryName);
    }

    var areEqual = utils.isEqual(existingItem, savedItem); 
    if (!areEqual) {
      await updateGloassaryTerm(authToken, hostname, term, existingItem.terms.data.find((x: any) => x.name == term.name));
    }
  } 
}

async function createGloassary(authToken: string, hostname: string, savedGloassary: any){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation createGlossaryCategory($category: InputGlossaryCategory!) {
      management {
          createGlossaryCategory(category: $category) {
              id
          }
      }
  }
  `,
    variables: {
      category: {
        name: savedGloassary.name
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
      return response.data.data.management.createGlossaryCategory.id;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function createGloassaryTerm(authToken: string, hostname: string, savedGlossaryTerm: any, categoryId: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation createGlossaryTerm($term: InputGlossaryTerm) {
      management {
          createGlossaryTerm(term: $term) {
              id
              name
              categoryId
          }
      }
  }
  `,
    variables: {
      term: {
        "name": savedGlossaryTerm.name,
        "categoryId": categoryId
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
      return response.data.data.management.createGlossaryTerm.id;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function updateGloassaryTerm(authToken: string, hostname: string, savedGlossaryTerm: any, existingGlossaryTerm: any){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation saveGlossaryTerm($term: InputGlossaryTerm) {
      management {
          id
          saveGlossaryTerm(term: $term) {
              id
              name
              categoryId
              category {
                  id
                  name
              }
              active
              createdBy
              modifiedBy
              isEndorsedByCurrentUser
              ownedBy
              createdAt
              modifiedAt
              shortDescription
              certificationLevel
              userRating
              rating
              version
              ruleSet
              description
              isObsolete
              endorsedBy
              relatedTags {
                  id
                  name
              }
          }
      }
    }
  `,
    variables: {
      term: {
        "id": existingGlossaryTerm.id,
        "name": savedGlossaryTerm.name,
        "active": savedGlossaryTerm.active,
        "ownedBy": existingGlossaryTerm.ownedBy,
        "shortDescription": savedGlossaryTerm.shortDescription,
        "certificationLevel": savedGlossaryTerm.certificationLevel,
        "description": savedGlossaryTerm.description,
        "categoryId": existingGlossaryTerm.categoryId,
        "ruleSet": savedGlossaryTerm.ruleSet,
        "relatedTags": savedGlossaryTerm.relatedTags
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
      return response.data.data.management.saveGlossaryTerm.id;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getGloassaryCategoryByName(authToken: string, hostname: string, categoryName: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query getGlossaryCategoryByName($categoryName: String) {
      management {
          glossaryCategoryByName(name: $categoryName) {
              id
              name
              terms {
                  total
                  data {
                      id
                      name
                  }
              }
          }
      }
  }
  `,
    variables: {
      categoryName: categoryName
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
       var gloassary = response.data.data.management.glossaryCategoryByName;
       return getGloassaryById(authToken, hostname, gloassary.id);
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getGloassaryById(authToken: string, hostname: string, gloassaryCategoryId: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query getGlossaryGategoryById($id: ID!) {
      management {
          glossaryCategory(id: $id) {
              id
              name
              terms {
                  total
                  data {
                      id
                      name
                  }
              }
          }
      }
  }
  `,
    variables: {
      id: gloassaryCategoryId
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
  .then(async (response: any) => {
       if (response.data.errors != null && response.data.errors.length > 0){
           throw new Error(response.data.errors[0].message);
       }
       //HACK, because the cluedin API is not returning the data of the term we have to get the info by ID.
       //Logged with Cluedin Support Ticket number #2192565630
       const arrayData: any[] = [];

       for (var term of response.data.data.management.glossaryCategory.terms.data){
         var fullTerm: any = await getGlossaryTermById(authToken, hostname, term.id);
         arrayData.push(fullTerm);
       }

       response.data.data.management.glossaryCategory.terms.data = arrayData;

       return response.data.data.management.glossaryCategory;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getGlossaryTermById(authToken: string, hostname: string, glossaryTermId: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query getglossaryTermById($termId: ID!) {
      management {
          glossaryTerm(id: $termId) {
              id
              name
              active
              shortDescription
              certificationLevel
              description
              version
              isObsolete
              categoryId
              rating
              userRating
              ruleSet
              isEndorsedByCurrentUser
          }
      }
    }
  `,
    variables: {
      termId: glossaryTermId
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
       return response.data.data.management.glossaryTerm;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export default { exportGlossaries, importGlossaries };

