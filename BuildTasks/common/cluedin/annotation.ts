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
        return response.data.data.inbound.createDataSet;
    })
    .catch((error: Error) => {
      console.log(error);
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
    });
  }

  export async function addEdgeMapping(authToken: string, hostname: string, savedAnnotationEdge: any, annotationId: number){
    const axios = require('axios');
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
          edgeProperties: [],
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
    });
  }

  export async function editEdgeMapping(authToken: string, hostname: string, savedAnnotationEdge: any, edgeId: number){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `mutation editEdge($edgeId: ID!, $edgeConfiguration: InputEdgeConfiguration) {
        management {
            editEdge(edgeId: $edgeId, edgeConfiguration: $edgeConfiguration)
        }`,
      variables: {
        edgeId: edgeId,
        edgeConfiguration: {
          edgeProperties: savedAnnotationEdge.edgeProperties,
          entityTypeConfiguration: {
            icon: savedAnnotationEdge.entityTypeConfiguration.icon,
            entityType: savedAnnotationEdge.entityTypeConfiguration.entityType,
            displayName: savedAnnotationEdge.entityTypeConfiguration.displayName
          },
          origin: savedAnnotationEdge.origin,
          edgeType: savedAnnotationEdge.edgeType,
          direction: savedAnnotationEdge.direction,
          dataSetId: null, // Currently Not Supported, we dont have the names to get the new ID's
          dataSourceGroupId: null, // Currently Not Supported, we dont have the names to get the new ID's
          dataSourceId: null,  // Currently Not Supported, we dont have the names to get the new ID's
          key: savedAnnotationEdge.key
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
  
  export async function getAnnotationById(authToken: string, hostname: string, annotationId: number){
    const axios = require('axios');
    const data = JSON.stringify({
      query: `query getAnnotationById($id: ID) {
        preparation {
            annotation(id: $id) {
                id
                isDynamicVocab
                name
                entityType
                nameKey
                descriptionKey
                originEntityCodeKey
                createdDateMap
                modifiedDateMap
                cultureKey
                origin
                versionKey
                beforeCreatingClue
                beforeSendingClue
                useStrictEdgeCode
                useDefaultSourceCode
                vocabulary {
                    vocabularyName
                    providerId
                    keyPrefix
                }
                entityTypeConfiguration {
                    icon
                    displayName
                    entityType
                }
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
                        entityTypeConfiguration {
                            icon
                            displayName
                            entityType
                        }
                        origin
                        dataSourceGroupId
                        dataSourceId
                        dataSetId
                        direction
                        edgeProperties {
                            id
                            annotationEdgeId
                            originalField
                        }
                    }
                    validations {
                        id
                        displayName
                        inverse
                        parameters {
                            key
                            value
                        }
                    }
                    transformations {
                        filters {
                            parameters {
                                key
                                value
                            }
                            id
                            displayName
                            inverse
                        }
                        operations {
                            inverse
                            parameters {
                                key
                                value
                            }
                            id
                            displayName
                        }
                    }
                }
            }
        }
    }
    
    `,
      variables: {
        annotationId: annotationId
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
        return response.data.data.preparation.annotation;
    })
    .catch((error: Error) => {
      console.log(error);
    });
  }

  export default { addEdgeMapping, editEdgeMapping, modifyAnnotation, createManualAnnotation, getAnnotationById };