import utils from "./utils";
import auth from "./auth";
import vocabularies from "./vocabularies";

  export async function exportDataSources(authToken: string, hostname: string, outputPath: string){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `query getDataSources {
       inbound {
           dataSourceSets {
               total
               data {
                   id
                   name
                   editors
                   dataSources {
                       type
                       name
                       dataSets {
                           name
                           configuration
                           annotation {
                               id
                               entityType
                               originEntityCodeKey
                               origin
                               nameKey
                               vocabularyId
                               isDynamicVocab
                               useStrictEdgeCode
                               useDefaultSourceCode
                               annotationProperties {
                                   displayName
                                   key
                                   vocabKey
                                   coreVocab
                                   useAsEntityCode
                                   useAsAlias
                                   useSourceCode
                                   entityCodeOrigin
                                   type
                                   vocabularyKeyId
                               }
                               vocabulary {
                                   vocabularyId
                                   vocabularyName
                                   grouping
                                   keyPrefix
                                   isActive
                                   isCluedInCore
                                   isDynamic
                                   isProvider
                                   isVocabularyOwner
                                   providerId
                                   description
                               }
                               entityTypeConfiguration {
                                   icon
                                   displayName
                                   entityType
                               }
                           }
                           fieldMappings {
                               id
                               originalField
                               key
                               edges {
                                   edgeType
                                   dataSetId
                                   dataSourceId
                                   dataSourceGroupId
                                   entityType
                               }
                           }
                           originalFields
                       }
                   }
               }
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
         for (const dataSourceSet of response.data.data.inbound.dataSourceSets.data){
             utils.saveToDisk(outputPath, "DataSourceSets", dataSourceSet.name, dataSourceSet)
         }
         return response.data.data.inbound.dataSourceSets;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }
 
  export async function importDataSources(authToken: string, hostname: string, sourcePath: string){
    const fs = require('fs/promises');
    const directoryPath = sourcePath + 'DataSourceSets';
    const userInfo = await auth.getUserInfo(authToken, hostname);
  
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      if (file.endsWith('.json') == false) continue;
      await importDataSourceSet(authToken, hostname, userInfo.id, file.replace('.json', ''), sourcePath);
    }
  }

  async function importDataSourceSet(authToken: string, hostname: string, userId: string, datasourceSetName: string, sourcePath: string){
    console.log('Importing DataSourceSet ' + datasourceSetName);
    let existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, datasourceSetName);
    const savedDataSourceSet = utils.readFile(sourcePath + 'DataSourceSets/' + datasourceSetName + '.json');

    if (existingDataSourceSet == null || existingDataSourceSet.id == null) {
        console.log('Creating DataSourceSet');
        await createDataSourceSet(authToken, hostname, userId, savedDataSourceSet.name);
        existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, savedDataSourceSet.name);
    }

    const areEqual = utils.isEqual(existingDataSourceSet, savedDataSourceSet); 
    if (!areEqual) {
        for (const savedDataSource of savedDataSourceSet.dataSources){
          let dataSourceId: string;
          let existingDataSource = existingDataSourceSet.dataSources.find(function(x: any) { return x.name == savedDataSource.name; });
          
          if (existingDataSource == null || existingDataSource.id == null) {
              console.log('Creating DataSource');
              const createdDataSource = await createDataSource(authToken, hostname, userId, savedDataSource, existingDataSourceSet.id);
              dataSourceId = createdDataSource.id;
              
              existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, savedDataSourceSet.name);
              existingDataSource = existingDataSourceSet.dataSources.find(function(x: any) { return x.name == savedDataSource.name; })
          }
          else {
              dataSourceId = existingDataSource.id;
          }

          for (const savedDataSet of savedDataSource.dataSets){
              let dataSetId: string;
              let existingDataSet = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; });
              const dataSetsAreEqual = utils.isEqual(existingDataSet, savedDataSet); 
              if (!dataSetsAreEqual) {
                if (existingDataSet == null || existingDataSet.id == null) {
                    console.log('Creating DataSet');
                    const createdDataSet = await createDataSet(authToken, hostname, userId, savedDataSet, dataSourceId);
                    dataSetId = createdDataSet.id;
                    await createManualAnnotation(authToken, hostname, savedDataSet, createdDataSet);
                
                    existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, savedDataSourceSet.name);

                    existingDataSource = existingDataSourceSet.dataSources.find(function(x: any) { return x.name == savedDataSource.name; });
                    existingDataSet = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; });
                } 
                else {
                    dataSetId = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; }).id;
                }
        
                if (savedDataSet.annotation != null) {
                  const vocab = await vocabularies.getBasicVocabularyByName(authToken, hostname, savedDataSet.annotation.vocabulary.vocabularyName);
                  const vocabKeys = await vocabularies.getVocabKeysForVocabId(authToken, hostname, vocab.vocabularyId);

                  const savedMappedFields = savedDataSet.fieldMappings.filter((mapping: any) => mapping.key != "--ignore--");
                  const savedIgnoredFields = savedDataSet.fieldMappings.filter((mapping: any) => mapping.key == "--ignore--").map(selectOriginalField);
                  const existingMappedFields = existingDataSet.fieldMappings.filter((mapping: any) => mapping.key != "--ignore--");
                  const existingIgnoredFields = existingDataSet.fieldMappings.filter((mapping: any) => mapping.key == "--ignore--").map(selectOriginalField);

                  const ignoredFields = savedIgnoredFields.filter((mapping: string) => !existingIgnoredFields.includes(mapping));
                    
                    if (ignoredFields.length > 0)
                    {
                        await addIgnoredFieldsToDataSet(authToken, hostname, dataSetId, ignoredFields);
                    }
                    for (const fieldMapping of savedMappedFields){
                        //Add the field if it doesn't exist
                        const match = existingMappedFields.find(function(x: any) { return x.originalField == fieldMapping.originalField && x.key == fieldMapping.key; });
                        
                        if (match == null)
                        {
                          const vocabKey = vocabKeys.find(function(x: any) { return x.key == fieldMapping.key; });
                          await addPropertyMappingToCluedMappingConfiguration(authToken, hostname, fieldMapping.originalField, vocabKey.vocabularyId, vocabKey.vocabularyKeyId, dataSetId);
                        }
                    }
                }   
              }
          }
      }
    }
  }

  async function createDataSourceSet(authToken: string, hostname: string, userId: string, dataSourceSetName: string){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation createDataSourceSet($dataSourceSet: InputDataSourceSet) {
        inbound {
            createDataSourceSet(dataSourceSet: $dataSourceSet)  
        }
    }`,
      variables: {
        dataSourceSet: {
            name: dataSourceSetName,
            author: userId
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
        return response.data.data.inbound.createDataSourceSet;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

  async function createDataSource(authToken: string, hostname: string, userId: string, dataSource: any, dataSourceSetId: string){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mmutation createDataSource($dataSourceSetId: ID, $dataSource: InputDataSource) {
        inbound {
          createDataSource(
            dataSourceSetId: $dataSourceSetId
            dataSource: $dataSource
          ) {
            id
            name
          }
        }
      }`,
      variables: {
        dataSourceSetId: dataSourceSetId,
        dataSource: {
            type: dataSource.type,
            name: dataSource.name,
            author: userId
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
        return response.data.data.inbound.createDataSource;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

  async function createDataSet(authToken: string, hostname: string, userId: string, dataSet: any, dataSourceId: string){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation createDataSet($dataSourceId: ID, $dataSet: InputDataSet) {
        inbound {
          createDataSet(dataSourceId: $dataSourceId, dataSet: $dataSet) {
            id
            name
          }
        }
      }`,
      variables: {
        dataSourceId: dataSourceId,
        dataSet: {
            name: dataSet.name,
            type: "endpoint",
            store: true,
            configuration: dataSet.configuration,
            author: userId
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
        return response.data.data.inbound.createDataSet;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }
 
  async function createManualAnnotation(authToken: string, hostname: string, dataSet: any, dataSetId: any){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation createManualAnnotation(
        $dataSetId: ID!
        $type: String!
        $mappingConfiguration: InputMappingConfiguration
        $isDynamicVocab: Boolean
    ) {
        management {
            createManualAnnotation(
                dataSetId: $dataSetId
                type: $type
                mappingConfiguration: $mappingConfiguration
                isDynamicVocab: $isDynamicVocab
            ) {
                id
            }
        }
    }`,
      variables: {
        dataSetId: dataSetId.id,
        type: "endpoint",
        mappingConfiguration: {
            entityTypeConfiguration: dataSet.configuration.entityTypeConfiguration,
            //ignoredFields = [],
            vocabularyConfiguration: {
                new: false,
                vocabularyName: dataSet.annotation.vocabulary.vocabularyName,
                keyPrefix: dataSet.annotation.vocabulary.keyPrefix,
                vocabularyId: dataSet.annotation.vocabulary.vocabularyId // TODO this might be different in other environments
            }
        },
        isDynamicVocab: true
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
        return response.data.data.inbound.createDataSet;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

  async function addPropertyMappingToCluedMappingConfiguration(authToken: string, hostname: string, originalField: string, vocabularyId: string, vocabularyKeyId: string, dataSetId: string){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation addPropertyMappingToCluedMappingConfiguration(
        $dataSetId: ID!
        $propertyMappingConfiguration: InputPropertyMappingConfiguration
      ) {
        management {
          addPropertyMappingToCluedMappingConfiguration(
            dataSetId: $dataSetId
            propertyMappingConfiguration: $propertyMappingConfiguration
          )
        }
      }`,
      variables: {
        dataSetId: dataSetId,
        propertyMappingConfiguration: {
            originalField: originalField,
            useAsAlias: false,
            useAsEntityCode: false,
            vocabularyKeyConfiguration: {
                vocabularyId: vocabularyId,
                new: false,
                vocabularyKeyId: vocabularyKeyId
            }
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

  async function addIgnoredFieldsToDataSet(authToken: string, hostname: string, dataSetId: string, ignoredOriginalFields: any){
    const axios = require('axios');
    const ignoredMappings = ignoredOriginalFields.map(mapIgnoreFields);

    const data = JSON.stringify({
      query: `mutation addAnnotationMappingToDataSet(
        $dataSetId: ID
        $fieldMappings: [InputPropertyMapping]
      ) {
        inbound {
          addAnnotationMappingToDataSet(
            dataSetId: $dataSetId
            fieldMappings: $fieldMappings
          )
        }
      }`,
      variables: {
        dataSetId: dataSetId,
        fieldMappings: ignoredMappings
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
  
  async function getDataSourceSetByName(authToken: string, hostname: string, streamName: string){
    const axios = require('axios');
    const data = JSON.stringify({
        query: `query getDataSourceSetByName($name: String!) {
            inbound {
                dataSourceSetByName(name: $name) {
                        id
                        name
                        editors
                        createdAt
                        updatedAt
                        dataSources {
                            id
                            type
                            name
                            createdAt
                            updatedAt
                            dataSets {
                                id
                                name
                                configuration
                                createdAt
                                updatedAt
                                annotation {
                                    id
                                    entityType
                                    originEntityCodeKey
                                    origin
                                    nameKey
                                    isDynamicVocab
                                    useStrictEdgeCode
                                    useDefaultSourceCode
                                    updatedAt
                                    createdAt
                                    annotationProperties {
                                        displayName
                                        key
                                        vocabKey
                                        coreVocab
                                        useAsEntityCode
                                        useAsAlias
                                        useSourceCode
                                        entityCodeOrigin
                                        type
                                        vocabularyKeyId
                                    }
                                    vocabulary {
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
                                    }
                                    entityTypeConfiguration {
                                        icon
                                        displayName
                                        entityType
                                    }
                                }
                                fieldMappings {
                                    id
                                    originalField
                                    key
                                    edges {
                                        edgeType
                                        dataSetId
                                        dataSourceId
                                        dataSourceGroupId
                                        entityType
                                    }
                                }
                                originalFields
                            }
                        }
                }
            }
        }`,
        variables: {
            name: streamName
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
            return response.data.data.inbound.dataSourceSetByName;
    })
    .catch((error: Error) => {
        console.log(error);
    });
  }

  function mapIgnoreFields (item:any){
    return { originalField: item, key: "--ignore--" };
  }

  function selectOriginalField (item:any){
    return item.originalField;
  }
    
export default { exportDataSources, importDataSources };