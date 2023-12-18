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
            var vocabInfo = await getVocabularyDetails(authToken, hostname, vocabulary.vocabularyId);
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
     return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getVocabularyDetails(authToken: string, hostname: string, vocabularyId: string){
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
    return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getVocabKeysForVocabId(authToken: string, hostname: string, vocabularyId: string){
  const axios = require('axios');
  let data = JSON.stringify({
      query: `query getVocabularyKeysFromVocabularyId($vocabId: ID!) {
          management {
              vocabularyKeysFromVocabularyId(id: $vocabId) {
                  total
                  data {
                      displayName
                      vocabularyKeyId
                      name
                      key
                      vocabularyId
                  }
              }
          }
      }`,
      variables: {
          vocabId: vocabularyId
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
      return response.data.data.management.vocabularyKeysFromVocabularyId.data;
  })
  .catch((error: Error) => {
      console.log(error);
  });
}

async function getBasicVocabularyByName(authToken: string, hostname: string, vocabularyName: string){
  const axios = require('axios');
  let data = JSON.stringify({
      query: `query getVocabularyByName($name: String!) {
          management {
              vocabularies(searchName: $name) {
                  total
                  data {
                      vocabularyId
                      vocabularyName
                      keyPrefix
                      grouping
                      isActive
                      isCluedInCore
                      isDynamic
                      isProvider
                      isVocabularyOwner
                      providerId
                      description
                  }
              }
          }
      }`,
      variables: {
          name: vocabularyName
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
      return response.data.data.management.vocabularies.data.find(function(x: any) { return x.vocabularyName == vocabularyName; });
  })
  .catch((error: Error) => {
      console.log(error);
  });
}

async function getVocabularyByName(authToken: string, hostname: string, vocabularyName: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `query getVocabularyByName($name: String) {
       management {
           vocabularies(searchName: $name) {
               total
               data {
                   vocabularyId
                   vocabularyName
               }
           }
       }
   }
   `,
    variables: {
       name: vocabularyName
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
       var vocabBasic =  response.data.data.management.vocabularies.data.find(function(x: any) { return x.name == vocabularyName; });
       return await getVocabularyDetails(authToken, hostname, vocabBasic.vocabularyId);
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function importVocabularies(authToken: string, hostname: string, sourcePath: string){
  const fs = require('fs');
  const directoryPath = sourcePath + 'Vocabularies';

  fs.readdir(directoryPath, async function (err: string, files: string[]) {
      //handling error
      if (err) {
          return console.log('Unable to scan Vocabularies directory: ' + err);
      } 

      for (const file of files) {
        await importVocabulary(authToken, hostname, file.replace('.json', ''), sourcePath);
      }
  });
}

async function importVocabulary(authToken: string, hostname: string, vocabularyName: string, sourcePath: string){
  var savedRecord = utils.readFile(sourcePath + 'Vocabularies/' + vocabularyName + '.json');
  var existingVocabulary = await getVocabularyByName(authToken, hostname, vocabularyName);

  var savedVocabulary = savedRecord.data.management.vocabulary;
  // var vocabularyGroupNames = savedRecord.data.management.vocabularyGroupNames;

  if (existingVocabulary == null || existingVocabulary.id == null) {
      //create the vocabulary
      console.log('Creating vocabulary: ' + vocabularyName);
      var id = await createVocabulary(authToken, hostname, savedVocabulary);
      existingVocabulary = await getVocabularyDetails(authToken, hostname, id);
  }

  //update the vocabulary
  var areEqual = utils.isEqual(existingVocabulary.data.management.vocabulary, savedVocabulary); 
  if (!areEqual) {
    console.log('Updating vocabulary: ' + vocabularyName);
    await updateVocabulary(authToken, hostname, savedVocabulary, existingVocabulary.data.management.vocabulary.id);
  }

  var savedVocabularyKeys = savedRecord.data.management.vocabularyKeysFromVocabularyId.data;
  var existingVocabularyKeys = existingVocabulary.data.management.vocabularyKeysFromVocabularyId.data;

  //TODO create & update VocabularyKeys
  for (const savedVocabularyKey of savedVocabularyKeys){
    var existingVocabularyKey = existingVocabularyKeys.find(function(x: any) { return x.name == savedVocabularyKey.name; });

    if (existingVocabularyKey == null || existingVocabularyKey.id == null) {
      //create the vocabulary key
      console.log('Creating vocabulary key: ' + savedVocabularyKey.name);
      await createVocabularyKey(authToken, hostname, existingVocabulary.id, savedVocabularyKey);
    }

    //update the vocabulary key
    var areEqual = utils.isEqual(existingVocabularyKey, savedVocabularyKey); 
    if (!areEqual) {
      console.log('Updating vocabulary key: ' + vocabularyName);
      await updateVocabularyKey(authToken, hostname, savedVocabularyKey, existingVocabulary.data.management.vocabulary.id, existingVocabularyKey.id);
    }
  }
}

async function createVocabulary(authToken: string, hostname: string, savedVocabulary: any){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation createVocabulary($vocabulary: InputVocabulary) {
      management {
          id
          createVocabulary(vocabulary: $vocabulary) {
              vocabularyId
              vocabularyName
          }
      }
  }`,
    variables: {
      "vocabulary": {
        "vocabularyName": savedVocabulary.vocabularyName,
        "entityTypeConfiguration": savedVocabulary.entityTypeConfiguration,
        "providerId": savedVocabulary.providerId,
        "keyPrefix": savedVocabulary.keyPrefix,
        "description": savedVocabulary.description
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
      return response.data.data.management.createVocabulary.vocabularyId;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function updateVocabulary(authToken: string, hostname: string, savedVocabulary: any, vocabularyId: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation saveVocabulary($vocabulary: InputVocabulary!) {
      management {
          id
          saveVocabulary(vocabulary: $vocabulary) {
              vocabularyId
          }
      }
  }`,
    variables: {
       vocabulary: {
          id: vocabularyId,
          name: savedVocabulary.name,
          isActive: savedVocabulary.isActive,
          condition: savedVocabulary.condition,
          vocabularies: savedVocabulary.vocabularies,
          description: savedVocabulary.description
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
      return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function createVocabularyKey(authToken: string, hostname: string, vocabularyId: string, savedVocabularyKey: any){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation createVocabularyKey($vocabularyKey: InputVocabularyKey) {
      management {
          id
          createVocabularyKey(vocabularyKey: $vocabularyKey) {
              vocabularyKeyId
          }
      }
    }`,
    variables: {
      "vocabularyId": vocabularyId,
      "displayName": savedVocabularyKey.displayName,
      "name": savedVocabularyKey.name,
      "groupName": savedVocabularyKey.groupName,
      "isVisible": savedVocabularyKey.isVisible,
      "dataType": savedVocabularyKey.dataType,
      "dataClassificationCode": savedVocabularyKey.dataClassificationCode,
      "description": savedVocabularyKey.description
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
      return response.data.data.management.createVocabularyKey.vocabularyKeyId;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function updateVocabularyKey(authToken: string, hostname: string, savedVocabularyKey: any, vocabularyId: string, vocabularyKeyId: string){
  const axios = require('axios');
  let data = JSON.stringify({
    query: `mutation saveVocabularyKey($vocabularyKey: InputVocabularyKey!) {
      management {
          id
          saveVocabularyKey(vocabularyKey: $vocabularyKey) {
              vocabularyKeyId
          }
      }
  }`,
    variables: {
      "vocabularyKey": {
        "vocabularyId": vocabularyId,
        "vocabularyKeyId": vocabularyKeyId,
        "displayName": savedVocabularyKey.displayName,
        "name": savedVocabularyKey.name,
        "isVisible": savedVocabularyKey.isVisible,
        "groupName": savedVocabularyKey.groupName,
        "dataAnnotationsIsEditable": null,
        "dataAnnotationsIsNullable": null,
        "dataAnnotationsIsPrimaryKey": null,
        "dataAnnotationsIsRequired": null,
        "dataAnnotationsMaximumLength": null,
        "dataAnnotationsMinimumLength": null,
        "dataType": savedVocabularyKey.dataType,
        "storage": savedVocabularyKey.storage,
        "dataClassificationCode": savedVocabularyKey.data,
        "description": savedVocabularyKey.description,
        "mapsToOtherKeyId": null,
        "isValueChangeInsignificant": savedVocabularyKey.isValueChangeInsignificant,
        "glossaryTermId": null
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
      return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export default { exportVocabularies, importVocabularies, getVocabKeysForVocabId, getBasicVocabularyByName };

