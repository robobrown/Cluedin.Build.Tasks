import utils from "./utils";

export async function exportVocabularies(authToken: string, hostname: string, outputPath: string, vocabularyNames: string, includeCluedInCore: boolean){
    let pageNumber = 1;
    let total = 0;
    let count = 0;
   
     while (count <= total){
       const result = await getVocabulariesByPage(authToken, hostname, pageNumber);

       for (const vocabulary of result.data){
            if (includeCluedInCore == false && vocabulary.isCluedInCore){
              continue;
            }
            if (vocabularyNames != '*' && vocabularyNames != '' && vocabularyNames.split(',').indexOf(vocabulary.vocabularyName) == -1 && vocabularyNames.split(',').indexOf(vocabulary.keyPrefix) == -1){
              continue;
            }

            const vocabInfo = await getVocabularyDetails(authToken, hostname, vocabulary.vocabularyId);
            utils.saveToDisk(outputPath, "Vocabularies", vocabulary.vocabularyName, vocabInfo)
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
 
async function getVocabulariesByPage(authToken: string, hostname: string, pageNumber: number){
  const axios = require('axios');
  const data = JSON.stringify({
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
     return response.data.data.management.vocabularies;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getVocabularyDetails(authToken: string, hostname: string, vocabularyId: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
    return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export async function getVocabKeysForVocabId(authToken: string, hostname: string, vocabularyId: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data.management.vocabularyKeysFromVocabularyId.data;
  })
  .catch((error: Error) => {
      console.log(error);
  });
}

export async function getBasicVocabularyByName(authToken: string, hostname: string, vocabularyName: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data.management.vocabularies.data.find(function(x: any) { return x.vocabularyName == vocabularyName; });
  })
  .catch((error: Error) => {
      console.log(error);
  });
}

async function getVocabularyByName(authToken: string, hostname: string, vocabularyName: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
       const vocabBasic = response.data.data.management.vocabularies.data.find(function(x: any) { return x.vocabularyName == vocabularyName; });
       return await getVocabularyDetails(authToken, hostname, vocabBasic.vocabularyId);
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export async function importVocabularies(authToken: string, hostname: string, sourcePath: string){
  const fs = require('fs/promises');
  const directoryPath = sourcePath + 'Vocabularies';

  const files = await fs.readdir(directoryPath);
  for (const file of files) {
    if (file.endsWith('.json') == false) continue;
    await importVocabulary(authToken, hostname, file.replace('.json', ''), sourcePath);
  }
}

async function importVocabulary(authToken: string, hostname: string, vocabularyName: string, sourcePath: string){
  console.log('Importing Vocabulary ' + vocabularyName);
  const savedRecord = utils.readFile(sourcePath + 'Vocabularies/' + vocabularyName + '.json');
  let existingVocabulary = await getVocabularyByName(authToken, hostname, vocabularyName);
  const savedVocabulary = savedRecord.management.vocabulary;

  if (existingVocabulary.management.vocabulary == null || existingVocabulary.management.vocabulary.vocabularyId == null) {
      //create the vocabulary
      console.log('Creating vocabulary: ' + vocabularyName);
      const id = await createVocabulary(authToken, hostname, savedVocabulary);
      existingVocabulary = await getVocabularyDetails(authToken, hostname, id);
  }

  //update the vocabulary
  const areEqual = utils.isEqual(existingVocabulary.management.vocabulary, savedVocabulary); 
  if (!areEqual) {
    console.log('Updating vocabulary: ' + vocabularyName);
    await updateVocabulary(authToken, hostname, savedVocabulary, existingVocabulary.management.vocabulary.vocabularyId);
  }

  const savedVocabularyKeys = savedRecord.management.vocabularyKeysFromVocabularyId.data;
  const existingVocabularyKeys = existingVocabulary.management.vocabularyKeysFromVocabularyId.data;

  for (const savedVocabularyKey of savedVocabularyKeys){
    const existingVocabularyKey = existingVocabularyKeys.find(function(x: any) { return x.name == savedVocabularyKey.name; });

    if (existingVocabularyKey == null || existingVocabularyKey.vocabularyKeyId == null) {
      //create the vocabulary key
      console.log('Creating vocabulary key: ' + savedVocabularyKey.name);
      await createVocabularyKey(authToken, hostname, existingVocabulary.management.vocabulary.vocabularyId, savedVocabularyKey);
    }

    //update the vocabulary key
    const areEqual = utils.isEqual(existingVocabularyKey, savedVocabularyKey); 
    if (!areEqual) {
      console.log('Updating vocabulary key: ' + savedVocabularyKey.name);
      await updateVocabularyKey(authToken, hostname, savedVocabularyKey, existingVocabulary.management.vocabulary.vocabularyId, existingVocabularyKey.vocabularyKeyId);
    }
  }
}

async function createVocabulary(authToken: string, hostname: string, savedVocabulary: any){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data.management.createVocabulary.vocabularyId;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function updateVocabulary(authToken: string, hostname: string, savedVocabulary: any, vocabularyId: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function createVocabularyKey(authToken: string, hostname: string, vocabularyId: string, savedVocabularyKey: any){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data.management.createVocabularyKey.vocabularyKeyId;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function updateVocabularyKey(authToken: string, hostname: string, savedVocabularyKey: any, vocabularyId: string, vocabularyKeyId: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

export default { exportVocabularies, importVocabularies, getVocabKeysForVocabId, getBasicVocabularyByName };
