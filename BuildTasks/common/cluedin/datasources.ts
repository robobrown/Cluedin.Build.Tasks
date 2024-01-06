import utils from "./utils";
import auth from "./auth";
import vocabularies from "./vocabularies";
import annotation from "./annotation";

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
                                   annotationEdges {
                                    id
                                    key
                                    edgeType
                                    entityType
                                    origin
                                    dataSourceGroupId
                                    dataSourceId
                                    dataSetId
                                    direction
                                    entityTypeConfiguration {
                                        icon
                                        displayName
                                        entityType
                                    }
                                    edgeProperties {
                                        id
                                        annotationEdgeId
                                        originalField
                                        vocabularyKeyId
                                        vocabularyKey {
                                            displayName
                                            vocabularyKeyId
                                        }
                                    }
                                }
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
            sortDataSourceSet(dataSourceSet);
            utils.saveToDisk(outputPath, "DataSourceSets", dataSourceSet.name, dataSourceSet)
         }
         return response.data.data.inbound.dataSourceSets;
    })
    .catch((error: Error) => {
      console.log(error);
      throw error;
    });
  }
 

  export async function importDataSources(authToken: string, hostname: string, sourcePath: string){
    const fs = require('fs');
    const directoryPath = sourcePath + 'DataSourceSets';

    if (!fs.existsSync(directoryPath)){
      return;
    }

    const userInfo = await auth.getUserInfo(authToken, hostname);
  
    const files = await fs.readdirSync(directoryPath);
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
        await createDataSourceSet(authToken, hostname, userId, savedDataSourceSet.name);
        existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, savedDataSourceSet.name);
    }

    const areEqual = utils.isEqual(existingDataSourceSet, savedDataSourceSet); 
    if (!areEqual) {
        for (const savedDataSource of savedDataSourceSet.dataSources){
          let dataSourceId: string;
          let existingDataSource = existingDataSourceSet.dataSources.find(function(x: any) { return x.name == savedDataSource.name; });
          
          if (existingDataSource == null || existingDataSource.id == null) {
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
                const vocab = await vocabularies.getBasicVocabularyByName(authToken, hostname, savedDataSet.annotation.vocabulary.vocabularyName);

                if (existingDataSet == null || existingDataSet.id == null) {
                    const createdDataSet = await createDataSet(authToken, hostname, userId, savedDataSet, dataSourceId);
                    dataSetId = createdDataSet.id;
                    await annotation.createManualAnnotation(authToken, hostname, savedDataSet, createdDataSet, vocab.vocabularyId);

                    existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, savedDataSourceSet.name);

                    existingDataSource = existingDataSourceSet.dataSources.find(function(x: any) { return x.name == savedDataSource.name; });
                    existingDataSet = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; });
                } 
                else {
                    dataSetId = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; }).id;
                }
        
                if (savedDataSet.annotation != null) {
               
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

                  //modify the annotation to set originEntityCodeKey, customOrigin, nameKey, etc not all functionality is available on the Create Annotation
                  //also checked the other methods on CluedIn, seems like the "linking" of existing annotations requires an existing dataset to be loaded and we dont have this yet.
                  await annotation.modifyAnnotation(authToken, hostname, savedDataSet.annotation, existingDataSet.annotationId, vocab.vocabularyId);

                  const existingAnnotation = await annotation.getAnnotationById(authToken, hostname, existingDataSet.annotationId);
                  
                  for (const annotationProperty of savedDataSet.annotation.annotationProperties){
                    //only if there are edges defined
                    if (annotationProperty.annotationEdges !== undefined){
                      //get the existing annotation property
                      const existingAnnotationProperty = existingAnnotation.annotationProperties.find((prop: any) => prop.key == annotationProperty.key);

                      for (const annotationEdge of annotationProperty.annotationEdges){
                        let existingEdge = undefined;
                        if (existingAnnotationProperty.annotationEdges !== undefined){
                          existingEdge = existingAnnotationProperty.annotationEdges.find((edge: any) => edge.edgeType == annotationEdge.edgeType)
                        }

                        if (existingEdge === undefined){
                          // if the specific edge type does not exist add it
                          console.log("adding edge mapping " + annotationEdge.key)
                          await annotation.addEdgeMapping(authToken, hostname, annotationEdge, existingDataSet.annotationId);
                        } 
                        else {
                          const areEqual = utils.isEqual(existingEdge, annotationEdge); 
                          if (!areEqual) {
                            // update the edge
                            console.log("updating edge mapping " + annotationEdge.key)
                            await annotation.editEdgeMapping(authToken, hostname, annotationEdge, existingEdge.edgeId);
                          }
                        }
                      }
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
      throw error;
    });
  }

  async function createDataSource(authToken: string, hostname: string, userId: string, dataSource: any, dataSourceSetId: string){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation createDataSource($dataSourceSetId: ID, $dataSource: InputDataSource) {
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
    console.log(JSON.parse(data));

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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
                                    name
                                    entityType
                                    originEntityCodeKey
                                    origin
                                    nameKey
                                    descriptionKey
                                    cultureKey
                                    versionKey
                                    updatedAt
                                    createdAt
                                    createdDateMap
                                    modifiedDateMap
                                    isDynamicVocab
                                    beforeCreatingClue
                                    beforeSendingClue
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
                                        annotationEdges {
                                          id
                                          key
                                          edgeType
                                          entityType
                                          origin
                                          dataSourceGroupId
                                          dataSourceId
                                          dataSetId
                                          direction
                                          entityTypeConfiguration {
                                              icon
                                              displayName
                                              entityType
                                          }
                                          edgeProperties {
                                              id
                                              annotationEdgeId
                                              originalField
                                              vocabularyKeyId
                                              vocabularyKey {
                                                  displayName
                                                  vocabularyKeyId
                                              }
                                          }
                                      }
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
        throw error;
    });
  }

  function mapIgnoreFields (item:any){
    return { originalField: item, key: "--ignore--" };
  }

  function selectOriginalField (item:any){
    return item.originalField;
  }
  
  function sortDataSourceSet(dataSourceSet: any){
    if (dataSourceSet.dataSources == null) 
      return;

    for (const datasource of dataSourceSet.dataSources){
      if (datasource.dataSets == null) 
        continue;

        for (const dataset of datasource.dataSets){
          if (dataset.annotation != null && dataset.annotation.annotationProperties != null){
            dataset.annotation.annotationProperties.sort((a: any, b: any) => (a.key > b.key) ? 1 : -1);
          }

          if (dataset.fieldMappings != null){
            dataset.fieldMappings.sort((a: any, b: any) => (a.originalField > b.originalField) ? 1 : -1);
          }

          if (dataset.originalFields != null){
            dataset.originalFields.sort();
          }
        }

        datasource.dataSets.sort((a: any, b: any) => (a.name > b.name) ? 1 : -1);
    }

    dataSourceSet.dataSources.sort((a: any, b: any) => (a.name > b.name) ? 1 : -1);
  }

export default { exportDataSources, importDataSources };