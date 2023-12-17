import utils from "./utils";

async function exportVocabularies(authToken: string, hostname: string, outputPath: string, vocabularyNames: string, includeCluedInCore: boolean){
    var pageNumber = 1;
    var total = 0;
    var count = 0;
   
     while (count <= total){
       var result = await getVocabulariesByPage(authToken, hostname, pageNumber);

       for (const vocabulary of result.data.management.vocabularies.data){
            if (includeCluedInCore == false && vocabulary.isCluedInCore){
              continue;
            }
            if (vocabularyNames != '*' && vocabularyNames != '' && vocabularyNames.split(',').indexOf(vocabulary.vocabularyName) == -1 && vocabularyNames.split(',').indexOf(vocabulary.keyPrefix) == -1){
              continue;
            }

            console.log('Exporting vocabulary: ' + vocabulary.vocabularyName);
            var vocabInfo = await getVocabulariesDetails(authToken, hostname, vocabulary.vocabularyId);
            utils.saveToDisk(outputPath, "Vocabularies", vocabulary.vocabularyName, vocabInfo)
       };

       total = result.data.management.vocabularies.total;
       count += result.data.management.vocabularies.data.length;
       pageNumber = pageNumber + 1;
       if (count == total)
       { 
         break;
       }
    }
 }
 
//  async function importVocabularies(authToken: string, hostname: string, sourcePath: string){
//   const fs = require('fs');
//   const directoryPath = sourcePath + 'Vocabularies';

//   fs.readdir(directoryPath, async function (err: string, files: string[]) {
//       //handling error
//       if (err) {
//           return console.log('Unable to scan Vocabularies directory: ' + err);
//       } 

//       for (const file of files) {
//         await importVocabulary(authToken, hostname, file.replace('.json', ''), sourcePath);
//       }
//   });
// }

// async function importVocabulary(authToken: string, hostname: string, vocabularyName: string, sourcePath: string){
//   var savedVocabulary = utils.readFile(sourcePath + 'Vocabularies/' + vocabularyName + '.json');
//   var existingVocabulary = await getVocabularyByName(authToken, hostname, vocabularyName);

//   if (existingVocabulary == null || existingVocabulary.id == null) {
//       //create the vocabulary
//       console.log('Creating vocabulary: ' + vocabularyName);
//       await createVocabulary(authToken, hostname, savedVocabulary);
//       existingVocabulary = await getVocabularyByName(authToken, hostname, vocabularyName);
//   }

//   //update the vocabulary
//   var areEqual = utils.isEqual(existingVocabulary, savedVocabulary); 
//   if (!areEqual) {
//     console.log('Updating vocabulary: ' + vocabularyName);
//     await updateVocabulary(authToken, hostname, savedVocabulary, existingVocabulary.id);

//     if (savedVocabulary.isActive)
//     {
//         console.debug('Activating vocabulary ' + existingVocabulary.name);
//         await activateVocabulary(authToken, hostname, existingVocabulary.id);
//     }
//   }
// }

async function getVocabulariesByPage(authToken: string, hostname: string, pageNumber: number){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query getVocabsByPage($pageNumber: Int) {
      management {
          vocabularies(pageNumber: $pageNumber, pageSize: 20) {
              total
              data {
                  vocabularyId
                  vocabularyName
                  isCluedInCore
                  keyPrefix
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

async function getVocabulariesDetails(authToken: string, hostname: string, vocabularyId: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query getVocabularyInfo($vocabularyId: ID!) {
      management {
          vocabulary(id: $vocabularyId) {
              vocabularyId
              vocabularyName
              grouping
              keyPrefix
              isActive
              createdAt
              createdBy
              isCluedInCore
              isDynamic
              isProvider
              isVocabularyOwner
              providerId
              description
              entityTypeConfiguration {
                  icon
                  displayName
                  entityType
              }
          }
          vocabularyGroupNames(vocabularyID: $vocabularyId) {
              name
              sortOrdinal
          }
          vocabularyKeysFromVocabularyId(id: $vocabularyId) {
              total
              data {
                  displayName
                  vocabularyKeyId
                  isCluedInCore
                  isDynamic
                  isObsolete
                  isProvider
                  isVocabularyOwner
                  vocabularyId
                  name
                  isVisible
                  groupName
                  key
                  storage
                  mappedKey
                  dataClassificationCode
                  dataType
                  description
                  dataAnnotationsIsPrimaryKey
                  dataAnnotationsIsEditable
                  dataAnnotationsIsNullable
                  dataAnnotationsIsRequired
                  dataAnnotationsMinimumLength
                  dataAnnotationsMaximumLength
                  providerId
                  compositeVocabularyId
                  mapsToOtherKeyId
                  createdAt
                  createdBy
                  isValueChangeInsignificant
                  glossaryTermId
              }
          }
      }
    }`,
    variables: {
      vocabularyId: vocabularyId
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

// async function getVocabularyByName(authToken: string, hostname: string, vocabularyName: string){
//  const axios = require('axios');
//  let data = JSON.stringify({
//    query: `query getVocabularyByName($name: String) {
//       management {
//           vocabularies(searchName: $name) {
//               total
//               data {
//                   id
//                   name
//                   isActive
//                   order
//                   condition
//                   actions
//                   vocabularies
//                   scope
//               }
//           }
//       }
//   }`,
//    variables: {
//       name: vocabularyName
//    }
//  });
 
//  let config = {
//    method: 'post',
//    maxBodyLength: Infinity,
//    url: 'https://' + hostname + '/graphql',
//    headers: { 
//      'Content-Type': 'application/json', 
//      'Authorization': 'Bearer ' + authToken
//    },
//    data : data
//  };

//  return axios.request(config)
//  .then((response: any) => {
//       if (response.data.errors != null && response.data.errors.length > 0){
//           throw new Error(response.data.errors[0].message);
//       }
//       return response.data.data.management.vocabularies.data.find(function(x: any) { return x.name == vocabularyName; });
//  })
//  .catch((error: Error) => {
//    console.log(error);
//  });
// }

// async function createVocabulary(authToken: string, hostname: string, savedVocabulary: any){
//   const axios = require('axios');
//   let data = JSON.stringify({
//     query: `mutation createVocabulary($vocabulary: InputCreateVocabulary!) {
//       management {
//         createVocabulary(vocabulary: $vocabulary) {
//                 id
//                 name
//             }
//         }
//     }`,
//     variables: {
//        vocabulary: {
//           name: savedVocabulary.name,
//        }
//     }
//   });
  
//   let config = {
//     method: 'post',
//     maxBodyLength: Infinity,
//     url: 'https://' + hostname + '/graphql',
//     headers: { 
//       'Content-Type': 'application/json', 
//       'Authorization': 'Bearer ' + authToken
//     },
//     data : data
//   };

//   return axios.request(config)
//   .then((response: any) => {
//       if (response.data.errors != null && response.data.errors.length > 0){
//           throw new Error(response.data.errors[0].message);
//       }
//       return response.data.data.management.createVocabulary.id;
//   })
//   .catch((error: Error) => {
//     console.log(error);
//   });
// }

// async function updateVocabulary(authToken: string, hostname: string, savedVocabulary: any, vocabularyId: string){
//   const axios = require('axios');
//   let data = JSON.stringify({
//     query: `mutation saveVocabulary($vocabulary: InputVocabulary!) {
//       management {
//         id
//         saveVocabulary(vocabulary: $vocabulary) {
//           id
//           name
//         }
//       }
//     }`,
//     variables: {
//        vocabulary: {
//           id: vocabularyId,
//           name: savedVocabulary.name,
//           isActive: savedVocabulary.isActive,
//           condition: savedVocabulary.condition,
//           vocabularies: savedVocabulary.vocabularies,
//           description: savedVocabulary.description
//        }
//     }
//   });
  
//   let config = {
//     method: 'post',
//     maxBodyLength: Infinity,
//     url: 'https://' + hostname + '/graphql',
//     headers: { 
//       'Content-Type': 'application/json', 
//       'Authorization': 'Bearer ' + authToken
//     },
//     data : data
//   };

//   return axios.request(config)
//   .then((response: any) => {
//       if (response.data.errors != null && response.data.errors.length > 0){
//           throw new Error(response.data.errors[0].message);
//       }
//       return response.data;
//   })
//   .catch((error: Error) => {
//     console.log(error);
//   });
// }

// async function activateVocabulary(authToken: string, hostname: string, vocabularyId: string){
//   const axios = require('axios');
//   let data = JSON.stringify({
//     query: `mutation activateVocabulary($vocabularyId: ID!) {
//       management {
//         id
//         activateVocabulary(vocabularyId: $vocabularyId) {
//           id
//           isActive
//           order
//         }
//       }
//     }`,
//     variables: {
//       vocabularyId: vocabularyId
//     }
//   });
  
//   let config = {
//     method: 'post',
//     maxBodyLength: Infinity,
//     url: 'https://' + hostname + '/graphql',
//     headers: { 
//       'Content-Type': 'application/json', 
//       'Authorization': 'Bearer ' + authToken
//     },
//     data : data
//   };

//   return axios.request(config)
//   .then((response: any) => {
//       if (response.data.errors != null && response.data.errors.length > 0){
//           throw new Error(response.data.errors[0].message);
//       }
//       return response.data;
//   })
//   .catch((error: Error) => {
//     console.log(error);
//   });
// }

// async function deleteVocabulariesByName(authToken: string, hostname: string, vocabularyNames: string){
//   var vocabularyIds:string[] = [];

//   if (vocabularyNames == "*"){
//     var pageNumber = 1;
//     var total = 0;
//     var count = 0;
   
//      while (count <= total){
//        var result = await getVocabulariesByPage(pageNumber, authToken, hostname);

//        for (const vocabulary of result.data.management.vocabularies.data){
//          vocabularyIds.push(vocabulary.id);
//        };

//        total = result.data.management.vocabularies.total;
//        count += result.data.management.vocabularies.data.length;
//        pageNumber = pageNumber + 1;
//        if (count == total)
//        { 
//          break;
//        }
//     }
//   }
//   else {
//     for (const vocabularyName of vocabularyNames.split(',')) {
//       var vocabulary = await getVocabularyByName(authToken, hostname, vocabularyName);
//       if (vocabulary != null && vocabulary.id != null) {
//         vocabularyIds.push(vocabulary.id);
//       }
//     }
//   }

//   await deleteVocabulariesById(authToken, hostname, vocabularyIds);
// }

// async function deleteVocabulariesById(authToken: string, hostname: string, vocabularyIds: string[]){
//   const axios = require('axios');
//   let data = JSON.stringify({
//     query: `mutation deleteVocabularies($vocabularyIds: [ID]) {
//       management {
//           deleteVocabularies(vocabularyIds: $vocabularyIds)
//       }
//   }`,
//     variables: {
//         vocabularyIds: vocabularyIds
//     }
//   });
  
//   let config = {
//     method: 'post',
//     maxBodyLength: Infinity,
//     url: 'https://' + hostname + '/graphql',
//     headers: { 
//       'Content-Type': 'application/json', 
//       'Authorization': 'Bearer ' + authToken
//     },
//     data : data
//   };

//   return axios.request(config)
//   .then((response: any) => {
//       if (response.data.errors != null && response.data.errors.length > 0){
//           throw new Error(response.data.errors[0].message);
//       }
//       return response.data;
//   })
//   .catch((error: Error) => {
//     console.log(error);
//   });
// }

//, importVocabularies, deleteVocabulariesByName
export default { exportVocabularies };

