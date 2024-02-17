import vocabularies from "./vocabularies";

export async function createManualAnnotation(authToken: string, hostname: string, dataSet: any, dataSetId: any, vocabularyId: string){
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
            vocabularyConfiguration: {
                new: false,
                vocabularyName: dataSet.annotation.vocabulary.vocabularyName,
                keyPrefix: dataSet.annotation.vocabulary.keyPrefix,
                vocabularyId: vocabularyId 
            }
        },
        isDynamicVocab: dataSet.annotation.isDynamicVocab
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
        return response.data.data.management.createManualAnnotation;
    })
    .catch((error: Error) => {
      console.log(error);
      throw error;
    });
  }

  export async function modifyAnnotation(authToken: string, hostname: string, savedAnnotation: any, annotationId: number, vocabularyId: number){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation modifyAnnotation($annotation: InputEntityAnnotation) {
        preparation {
          modifyAnnotation(annotation: $annotation)
        }
      }`,
      variables: {
        annotation: {
          id: annotationId,
          name: savedAnnotation.name,
          origin: savedAnnotation.origin,
          originEntityCodeKey: savedAnnotation.originEntityCodeKey,
          nameKey: savedAnnotation.nameKey,
          descriptionKey: savedAnnotation.descriptionKey,
          cultureKey: savedAnnotation.cultureKey,
          versionKey: savedAnnotation.versionKey,
          createdDateMap: savedAnnotation.createdDateMap,
          modifiedDateMap: savedAnnotation.modifiedDateMap,
          vocabularyId: vocabularyId,
          entityType: savedAnnotation.entityType
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

  export async function addEdgeMapping(authToken: string, hostname: string, savedAnnotationEdge: any, annotationId: number){
    const axios = require('axios');
    const edgeProperties: any[] = [];

    if (savedAnnotationEdge.edgeProperties != null){
      for (const edgeProperty of savedAnnotationEdge.edgeProperties){

        const vocab = await vocabularies.getBasicVocabularyByName(authToken, hostname, edgeProperty.vocabularyKey.vocabulary.vocabularyName);
        const vocabKeys = await vocabularies.getVocabKeysForVocabId(authToken, hostname, vocab.vocabularyId);
        const vocabKey = vocabKeys.find(function(x: any) { return x.key == edgeProperty.vocabularyKey.key; });

        edgeProperties.push({
          originalField: edgeProperty.originalField,
          vocabularyKeyConfiguration: {
            vocabularyId: vocab.vocabularyId,
            vocabularyKeyId: vocabKey.vocabularyKeyId,
            
            vocabularyKeyName: edgeProperty.vocabularyKey.vocabulary.vocabularyName,
            displayName: edgeProperty.vocabularyKey.displayName,
            dataType: edgeProperty.vocabularyKey.dataType,
            key: edgeProperty.vocabularyKey.key,
            groupName: edgeProperty.vocabularyKey.groupName
          }
        });
      }
    }

    const data = JSON.stringify({
      query: `mutation addEdgeMapping(
        $annotationId: ID!
        $key: String!
        $edgeConfiguration: InputEdgeConfiguration
      ) {
        management {
            addEdgeMapping(
                annotationId: $annotationId
                key: $key
                edgeConfiguration: $edgeConfiguration
            )
        }
      }`,
      variables: {
        annotationId: annotationId,
        edgeConfiguration: {
          edgeProperties: edgeProperties,
          entityTypeConfiguration: {
            new: false,
            icon: savedAnnotationEdge.entityTypeConfiguration.icon,
            entityType: savedAnnotationEdge.entityTypeConfiguration.entityType,
            displayName: savedAnnotationEdge.entityTypeConfiguration.displayName
          },
          edgeType: savedAnnotationEdge.edgeType,
          origin: savedAnnotationEdge.origin,
          // dataSourceId: savedAnnotationEdge.dataSourceId, // Currently Not Supported, we dont have the names to get the new ID's
          // dataSetId: savedAnnotationEdge.dataSetId, // Currently Not Supported, we dont have the names to get the new ID's
          direction: savedAnnotationEdge.direction
        },
        key: savedAnnotationEdge.key
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

  export async function editEdgeMapping(authToken: string, hostname: string, savedEdge: any, existingEdge: any){
    console.log("Edit Edge Mapping");
    const axios = require('axios');
    const edgeProperties: any[] = [];

    if (savedEdge.edgeProperties != null){
      for (const edgeProperty of savedEdge.edgeProperties){
        const existingEdgeProperty = existingEdge.edgeProperties.find((x: any) => x.originalField == edgeProperty.originalField);
        const existingId: string = existingEdgeProperty != null ? existingEdgeProperty.id : null;

        const vocab = await vocabularies.getBasicVocabularyByName(authToken, hostname, edgeProperty.vocabularyKey.vocabulary.vocabularyName);
        const vocabKeys = await vocabularies.getVocabKeysForVocabId(authToken, hostname, vocab.vocabularyId);
        const vocabKey = vocabKeys.find(function(x: any) { return x.key == edgeProperty.vocabularyKey.key; });

        edgeProperties.push({
          id: existingId,
          originalField: edgeProperty.originalField,
          vocabularyKeyConfiguration: {
            vocabularyId: vocab.vocabularyId,
            vocabularyKeyId: vocabKey.vocabularyKeyId,
            
            vocabularyKeyName: edgeProperty.vocabularyKey.vocabulary.vocabularyName,
            displayName: edgeProperty.vocabularyKey.displayName,
            dataType: edgeProperty.vocabularyKey.dataType,
            key: edgeProperty.vocabularyKey.key,
            groupName: edgeProperty.vocabularyKey.groupName
          }
        });

      }
    }

    const data = JSON.stringify({
      query: `mutation editEdge($edgeId: ID!, $edgeConfiguration: InputEdgeConfiguration) {
        management {
            editEdge(edgeId: $edgeId, edgeConfiguration: $edgeConfiguration)
        }
    }
    `,
      variables: {
        edgeId: existingEdge.id,
        edgeConfiguration: {
          edgeProperties: edgeProperties,
          entityTypeConfiguration: {
            icon: savedEdge.entityTypeConfiguration.icon,
            entityType: savedEdge.entityTypeConfiguration.entityType,
            displayName: savedEdge.entityTypeConfiguration.displayName
          },
          origin: savedEdge.origin,
          edgeType: savedEdge.edgeType,
          direction: savedEdge.direction,
          dataSetId: "", // Currently Not Supported, we dont have the names to get the new ID's
          dataSourceGroupId: "", // Currently Not Supported, we dont have the names to get the new ID's
          dataSourceId: "",  // Currently Not Supported, we dont have the names to get the new ID's
          key: savedEdge.key
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
  
  export async function getAnnotationById(authToken: string, hostname: string, annotationId: number){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `query getAnnotationById($id: ID) {
        preparation {
            annotation(id: $id) {
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
        }
    }
    `,
      variables: {
        id: annotationId
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
        const theAnnotation = response.data.data.preparation.annotation;
        sortAnnotation(theAnnotation);
        return theAnnotation;
    })
    .catch((error: Error) => {
      console.log(error);
      throw error;
    });
  }

  export function sortAnnotation(annotation: any){
    if (annotation.annotationProperties == null) 
      return;
    annotation.annotationProperties.sort((a: any, b: any) => (a.vocabKey > b.vocabKey) ? 1 : -1);

    for (const annotationProperty of annotation.annotationProperties){
      if (annotationProperty.annotationEdges == null) 
        continue;

      annotationProperty.annotationEdges.sort((a: any, b: any) => (a.key > b.key) ? 1 : -1);
      for (const annotationEdge of annotationProperty.annotationEdges){

        if (annotationEdge.edgeProperties == null) 
          continue;
        
          annotationEdge.edgeProperties.sort((a: any, b: any) => (a.originalField > b.originalField) ? 1 : -1);
      }
    }
  }

  export async function deleteEdgeMapping(authToken: string, hostname: string, edgeId: number){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation deleteEdge($edgeId: ID!) {
        management {
            deleteEdge(edgeId: $edgeId)
        }
    }
    
    `,
      variables: {
        edgeId: edgeId
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

  export default { addEdgeMapping, editEdgeMapping, modifyAnnotation, createManualAnnotation, getAnnotationById, sortAnnotation, deleteEdgeMapping };