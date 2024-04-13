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
                        id
                        type
                        name
                        dataSets {
                            id
                            name
                            configuration
                            annotationId
                            annotation {
                                id
                                name
                                entityType
                                originEntityCodeKey
                                origin
                                nameKey
                                descriptionKey
                                createdDateMap
                                modifiedDateMap
                                cultureKey
                                versionKey
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
                                          vocabularyKey {
                                              displayName
                                              name
                                              vocabulary {
                                                  vocabularyName
                                              }
                                              groupName
                                              storage
                                              dataType
                                              key
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
                            }
                        }
                    }
                }
            }
        }
    }
    `,
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
          console.log(JSON.stringify(response.data.errors));
          throw new Error(response.data.errors[0].message);
         }

         for (const dataSourceSet of response.data.data.inbound.dataSourceSets.data){
            sortDataSourceSet(dataSourceSet);

            if (dataSourceSet.dataSources == null) 
            continue;
    
            console.log('Looping dataSources' );
            for (const dataSource of dataSourceSet.dataSources){
              utils.saveToDisk(outputPath + "DataSourceSets/", dataSourceSet.name, dataSource.name, dataSource)
            }
    
         }
         return response.data.data.inbound.dataSourceSets;
    })
    .catch((error: Error) => {
      throw error;
    });
  }

  export async function importDataSources(authToken: string, hostname: string, sourcePath: string){
    console.log('Importing DataSources');
    const fs = require('fs');
    const path = require('node:path');
    const directoryPath = sourcePath + 'DataSourceSets';

    if (!fs.existsSync(directoryPath)){
      return;
    }

    const userInfo = await auth.getUserInfo(authToken, hostname);
  
    const files = await fs.readdirSync(directoryPath);
    for (const datasourceSetName of files) {
      const filePath = path.join(directoryPath, datasourceSetName);
      const fileStat = fs.statSync(filePath);

      // if the file is a directory, recursively search the directory
      if (fileStat.isDirectory()) {
        await importDataSourceSet(authToken, hostname, userInfo.id, datasourceSetName);

        const dataSourceFiles = await fs.readdirSync(filePath);
        for (const dataSource of dataSourceFiles) {
          if (dataSource.endsWith('.json') == false) continue;
          await importDataSource(authToken, hostname, userInfo.id, datasourceSetName, dataSource.replace('.json', ''), filePath);
        }
      } 
      
    }
  }

  async function importDataSourceSet(authToken: string, hostname: string, userId: string, datasourceSetName: string){
    console.log('Importing DataSourceSet ' + datasourceSetName);
    const existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, datasourceSetName);

    if (existingDataSourceSet == null || existingDataSourceSet.id == null) {
        console.log('Creating DataSourceSet ' + datasourceSetName);
        await createDataSourceSet(authToken, hostname, userId, datasourceSetName);
    }
  }

  async function importDataSource(authToken: string, hostname: string, userId: string, datasourceSetName: string, dataSetName: string, sourcePath: string){
    console.log('Importing DataSource ' + datasourceSetName + '/' + dataSetName);
    const existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, datasourceSetName);
    let existingDataSource = existingDataSourceSet.dataSources.find(function(x: any) { return x.name == dataSetName; });
    const savedDataSource = utils.readFile(sourcePath + '/' + dataSetName + '.json');

    let dataSourceId: string;
    if (existingDataSource == null || existingDataSource.id == null) {
      console.log('Creating DataSource ' + datasourceSetName + '/' + dataSetName);
      const createdDataSource = await createDataSource(authToken, hostname, userId, savedDataSource, existingDataSourceSet.id);
      dataSourceId = createdDataSource.id;
    }
    else {
      dataSourceId = existingDataSource.id;
    }
    
    existingDataSource = await getDataSourceById(authToken, hostname, dataSourceId);

    const areEqual = utils.isEqual(existingDataSource, savedDataSource); 
    if (!areEqual) {
      console.log('Updating DataSource ' + datasourceSetName + '/' + dataSetName);

      for (const savedDataSet of savedDataSource.dataSets){
          let dataSetId: string;
          let existingDataSet = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; });
          const dataSetsAreEqual = utils.isEqual(existingDataSet, savedDataSet); 
          if (!dataSetsAreEqual) {

            if (existingDataSet == null || existingDataSet.id == null) {
                console.log('Create DataSet ' + savedDataSet.name);
                const newDataSet = await createDataSet(authToken, hostname, userId, savedDataSet, dataSourceId);
                dataSetId = newDataSet.id;

                if (savedDataSet.annotation != null){
                  const vocab = await vocabularies.getBasicVocabularyByName(authToken, hostname, savedDataSet.annotation.vocabulary.vocabularyName);
                  console.log('Create Manual Annotation');
                  await annotation.createManualAnnotation(authToken, hostname, savedDataSet, newDataSet, vocab.vocabularyId);
                }

                existingDataSource = await getDataSourceById(authToken, hostname, dataSourceId);
                existingDataSet = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; });
            } 
            else {
                dataSetId = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; }).id;
            }
    
            if (savedDataSet.annotation != null) {
              console.log('Update Annotation ' + savedDataSet.annotation.name + ' on ' + savedDataSet.name);

              if (existingDataSet.annotationId == null){
                console.log("AnnotationId is null for " + savedDataSet.name);
                // continue; // BUG - this should not happen, but it does, so we need to skip this for now
                if (savedDataSet.annotation != null){
                  const vocab = await vocabularies.getBasicVocabularyByName(authToken, hostname, savedDataSet.annotation.vocabulary.vocabularyName);
                  console.log('Create Manual Annotation');
                  await annotation.createManualAnnotation(authToken, hostname, savedDataSet, existingDataSet, vocab.vocabularyId);
                }

                existingDataSource = await getDataSourceById(authToken, hostname, dataSourceId);
                existingDataSet = existingDataSource.dataSets.find(function(x: any) { return x.name == savedDataSet.name; });
              }

              const vocab = await vocabularies.getBasicVocabularyByName(authToken, hostname, savedDataSet.annotation.vocabulary.vocabularyName);
              if (vocab == null){
                throw new Error("Vocabulary not found " + savedDataSet.annotation.vocabulary.vocabularyName);
              }
              const vocabKeys = await vocabularies.getVocabKeysForVocabId(authToken, hostname, vocab.vocabularyId);
              
              const existingIgnoredFields = existingDataSet.fieldMappings.filter((mapping: any) => mapping.key == "--ignore--").map(selectOriginalField);
              const savedIgnoredFields = savedDataSet.fieldMappings.filter((mapping: any) => mapping.key == "--ignore--").map(selectOriginalField);
              const ignoredFields = savedIgnoredFields.filter((mapping: string) => !existingIgnoredFields.includes(mapping));
                
              if (ignoredFields.length > 0)
              {
                  console.log("addIgnoredFieldsToDataSet " + savedDataSet.name);
                  await addIgnoredFieldsToDataSet(authToken, hostname, dataSetId, ignoredFields);
              }

              const savedMappedFields = savedDataSet.fieldMappings.filter((mapping: any) => mapping.key != "--ignore--");
              const existingMappedFields = existingDataSet.fieldMappings.filter((mapping: any) => mapping.key != "--ignore--");

              let existingAnnotation = await annotation.getAnnotationById(authToken, hostname, existingDataSet.annotationId);

              for (const fieldMapping of savedMappedFields){
                  //Add the field if it doesn't exist
                  const vocabKey = vocabKeys.find(function(x: any) { return x.key == fieldMapping.key; });
                  const savedAnnotationProperty = savedDataSet.annotation.annotationProperties.find(function(x: any) { return x.vocabKey == fieldMapping.key; });

                  const match = existingMappedFields.find(function(x: any) { return x.originalField == fieldMapping.originalField && x.key == fieldMapping.key; });
                  if (match == null)
                  {
                    console.log("addPropertyMappingToCluedMappingConfiguration " + fieldMapping.originalField);
                    if (vocabKey == null){
                      throw new Error("VocabKey not found for " + fieldMapping.key + " on " + savedDataSet.name);
                    }
                    if (savedAnnotationProperty == null){
                      throw new Error("AnnotationProperty not found for " + fieldMapping.key + " on " + savedDataSet.name);
                    }
                    
                    await addPropertyMappingToCluedMappingConfiguration(authToken, hostname, fieldMapping.originalField, vocabKey.vocabularyId, vocabKey.vocabularyKeyId, dataSetId, savedAnnotationProperty.useAsAlias, savedAnnotationProperty.useAsEntityCode);
                    console.log("addPropertyMappingToCluedMappingConfiguration DONE");

                    if ((savedAnnotationProperty.entityCodeOrigin != null && savedAnnotationProperty.entityCodeOrigin != "")
                    || savedAnnotationProperty.useAsAlias == true
                    || savedAnnotationProperty.useAsEntityCode == true){
                      console.log("modifyBatchVocabularyClueMappingConfiguration - on Add " + fieldMapping.originalField);
                      await modifyBatchVocabularyClueMappingConfiguration(authToken, hostname, existingDataSet.annotationId, fieldMapping.key, savedAnnotationProperty.entityCodeOrigin, savedAnnotationProperty.useAsAlias, savedAnnotationProperty.useAsEntityCode)
                    }

                  } else {
                    const existingAnnotationProperty = existingAnnotation.annotationProperties.find((prop: any) => prop.vocabKey == match.key);
                    if (savedAnnotationProperty.useAsEntityCode && ( //only do this if the saved annotation is use as entity code otherise we need to remove the entity codes
                      savedAnnotationProperty.entityCodeOrigin != existingAnnotationProperty.entityCodeOrigin || 
                      savedAnnotationProperty.useAsAlias != existingAnnotationProperty.useAsAlias || 
                      savedAnnotationProperty.useAsEntityCode != existingAnnotationProperty.useAsEntityCode)){
                      console.log("modifyBatchVocabularyClueMappingConfiguration - on Update " + fieldMapping.originalField)
                      await modifyBatchVocabularyClueMappingConfiguration(authToken, hostname, existingDataSet.annotationId, fieldMapping.key, savedAnnotationProperty.entityCodeOrigin, savedAnnotationProperty.useAsAlias, savedAnnotationProperty.useAsEntityCode)
                    }
                  }
              }

              //modify the annotation to set originEntityCodeKey, customOrigin, nameKey, etc not all functionality is available on the Create Annotation
              //also checked the other methods on CluedIn, seems like the "linking" of existing annotations requires an existing dataset to be loaded and we dont have this yet.
              existingAnnotation = await annotation.getAnnotationById(authToken, hostname, existingDataSet.annotationId);
              const areEqual = utils.isEqual(savedDataSet.annotation, existingAnnotation); 
              if (!areEqual) {                    
                console.log("modifyAnnotation " + savedDataSet.annotation.name + " on " + savedDataSet.name);
                await annotation.modifyAnnotation(authToken, hostname, savedDataSet.annotation, existingDataSet.annotationId, vocab.vocabularyId);
                console.log("modifyAnnotation DONE " + savedDataSet.annotation.name + " on " + savedDataSet.name);
                existingAnnotation = await annotation.getAnnotationById(authToken, hostname, existingDataSet.annotationId);
              }

              // Add the Edge Mappings
              for (const annotationProperty of savedDataSet.annotation.annotationProperties){
                //get the existing annotation property
                const existingAnnotationProperty = existingAnnotation.annotationProperties.find((prop: any) => prop.key == annotationProperty.key);

                if (annotationProperty.annotationEdges != null){

                  for (const annotationEdge of annotationProperty.annotationEdges){
                    let existingEdge = null;
                    if (existingAnnotationProperty.annotationEdges != null){
                      existingEdge = existingAnnotationProperty.annotationEdges.find((edge: any) => edge.edgeType == annotationEdge.edgeType)
                    }

                    if (existingEdge == null){
                      // if the specific edge type does not exist add it
                      console.log("adding edge mapping " + annotationEdge.key + " on " + savedDataSet.name)
                      await annotation.addEdgeMapping(authToken, hostname, annotationEdge, existingDataSet.annotationId);
                    } 
                    else {
                      const areEqual = utils.isEqual(existingEdge, annotationEdge); 
                      if (!areEqual) {
                        // update the edge
                        console.log("updating edge mapping " + annotationEdge.key + " on " + savedDataSet.name);
                        await annotation.editEdgeMapping(authToken, hostname, annotationEdge, existingEdge);
                      }
                    }
                  }
                }
                
                if (existingAnnotationProperty != null && existingAnnotationProperty.annotationEdges != null){
                  let existingEdgesToRemove: any;
                  if (annotationProperty.annotationEdges == null){
                    existingEdgesToRemove = existingAnnotationProperty.annotationEdges;
                  } else {
                    existingEdgesToRemove = existingAnnotationProperty.annotationEdges.filter((edge: any) => annotationProperty.annotationEdges.find((x: any) => x.edgeType == edge.edgeType) == null);
                  }              

                  for (const existingEdge of existingEdgesToRemove){
                    // remove the edge
                    console.log("deleting edge mapping " + existingEdge.key + " on " + savedDataSet.name);
                    await annotation.deleteEdgeMapping(authToken, hostname, existingEdge.id);
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
          console.log(JSON.stringify(response.data.errors));
          throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.createDataSourceSet;
    })
    .catch((error: Error) => {
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
          console.log(JSON.stringify(response.data.errors));
          throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.createDataSource;
    })
    .catch((error: Error) => {
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
          console.log(JSON.stringify(response.data.errors));
          throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.createDataSet;
    })
    .catch((error: Error) => {
      throw error;
    });
  }
 
  async function addPropertyMappingToCluedMappingConfiguration(authToken: string, hostname: string, originalField: string, vocabularyId: string, vocabularyKeyId: string, dataSetId: string, useAsAlias: boolean = false, useAsEntityCode: boolean = false){
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
            useAsAlias: useAsAlias,
            useAsEntityCode: useAsEntityCode,
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
          console.log(JSON.stringify(response.data.errors));
          throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
    .catch((error: Error) => {
      throw error;
    });
  }

  async function modifyBatchVocabularyClueMappingConfiguration(authToken: string, hostname: string, annotationId: string, vocabularyKeyId: string, entityOrigin: string, useAsAlias: boolean = false, useAsEntityCode: boolean = false){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation modifyBatchVocabularyClueMappingConfiguration(
        $annotationId: ID!
        $batchPropertyMappings: InputBatchPropertyMapping
      ) {
        management {
          modifyBatchVocabularyClueMappingConfiguration(
            annotationId: $annotationId
            batchPropertyMappings: $batchPropertyMappings
          )
        }
      }`,
      variables: {
        annotationId: annotationId,
        batchPropertyMappings:             {
                propertyMappingSettings: [
                    {
                        vocabKey: vocabularyKeyId,
                        entityCodeOrigin: entityOrigin,
                        useAsEntityCode: useAsEntityCode,
                        useAsAlias: useAsAlias
                    }
                ]
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
          console.log(JSON.stringify(response.data.errors));
          throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
    .catch((error: Error) => {
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
          console.log(JSON.stringify(response.data.errors));
          throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
    .catch((error: Error) => {
      throw error;
    });
  }
  
  async function getDataSourceSetByName(authToken: string, hostname: string, dataSourceSetName: string){
    const axios = require('axios');
    const data = JSON.stringify({
        query: `query getDataSourceSetByName($name: String!) {
          inbound {
              dataSourceSetByName(name: $name) {
                  id
                  name
                  editors
                  dataSources {
                      id
                      type
                      name
                      dataSets {
                          id
                          name
                      }
                  }
              }
          }
      }
      `,
        variables: {
            name: dataSourceSetName
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
              console.log(JSON.stringify(response.data.errors));
              throw new Error(response.data.errors[0].message);
            }
            return response.data.data.inbound.dataSourceSetByName;
    })
    .catch((error: Error) => {
        throw error;
    });
  }

  async function getDataSourceById(authToken: string, hostname: string, id: string){
    const axios = require('axios');
    const data = JSON.stringify({
        query: `query getDataSourceById($id: ID!) {
          inbound {
              dataSource(id: $id) {
                  id
                  type
                  name
                  dataSets {
                      id
                      name
                      configuration
                      annotationId
                      annotation {
                          id
                          name
                          entityType
                          originEntityCodeKey
                          origin
                          nameKey
                          descriptionKey
                          createdDateMap
                          modifiedDateMap
                          cultureKey
                          versionKey
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
                                      vocabularyKey {
                                          displayName
                                          name
                                          vocabulary {
                                              vocabularyName
                                          }
                                          groupName
                                          storage
                                          dataType
                                          key
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
                      }
                  }
              }
          }
      }
      `,
        variables: {
          id: id
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
              console.log(JSON.stringify(response.data.errors));
              throw new Error(response.data.errors[0].message);
            }
            sortDataSource(response.data.data.inbound.dataSource);
            return response.data.data.inbound.dataSource;
    })
    .catch((error: Error) => {
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
          if (dataset.annotation != null){//} && dataset.annotation.annotationProperties != null){
            // dataset.annotation.annotationProperties.sort((a: any, b: any) => (a.key > b.key) ? 1 : -1);
            annotation.sortAnnotation(dataset.annotation);
          }

          if (dataset.fieldMappings != null){
            dataset.fieldMappings.sort((a: any, b: any) => (a.originalField > b.originalField) ? 1 : -1);
          }
        }

        datasource.dataSets.sort((a: any, b: any) => (a.name > b.name) ? 1 : -1);
    }

    dataSourceSet.dataSources.sort((a: any, b: any) => (a.name > b.name) ? 1 : -1);
  }

  function sortDataSource(datasource: any){
    if (datasource.dataSets == null) 
      return;
 
      for (const dataset of datasource.dataSets){
      if (dataset.annotation != null){//} && dataset.annotation.annotationProperties != null){
        // dataset.annotation.annotationProperties.sort((a: any, b: any) => (a.key > b.key) ? 1 : -1);
        annotation.sortAnnotation(dataset.annotation);
      }

      if (dataset.fieldMappings != null){
        dataset.fieldMappings.sort((a: any, b: any) => (a.originalField > b.originalField) ? 1 : -1);
      }
    }

    datasource.dataSets.sort((a: any, b: any) => (a.name > b.name) ? 1 : -1);
  }

export default { exportDataSources, importDataSources };