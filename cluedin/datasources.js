"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("./utils"));
const auth_1 = __importDefault(require("./auth"));
async function exportDataSources(authToken, hostname, outputPath) {
    const axios = require('axios');
    let data = JSON.stringify({
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
                       connectorConfigurationId
                       dataSets {
                           name
                           configuration
                           annotation {
                               id
                               name
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
        variables: {}
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        response.data.data.inbound.dataSourceSets.data.forEach((dataSourceSet) => {
            utils_1.default.saveToDisk(outputPath, "DataSourceSets", dataSourceSet.name, dataSourceSet);
        });
        return response.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function importDataSources(authToken, hostname, sourcePath) {
    const fs = require('fs');
    const directoryPath = sourcePath + 'DataSourceSets';
    const userId = await auth_1.default.getUserId(authToken, hostname);
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan DataSourceSets directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(async function (file) {
            // Do whatever you want to do with the file
            await importDataSourceSet(authToken, hostname, userId, file.replace('.json', ''), sourcePath);
        });
    });
}
async function importDataSourceSet(authToken, hostname, userId, datasourceSetName, sourcePath) {
    let existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, datasourceSetName);
    var savedDataSourceSet = await utils_1.default.readFile(sourcePath + 'DataSourceSets/' + datasourceSetName + '.json');
    if (existingDataSourceSet == null || existingDataSourceSet.id == null) {
        console.log('Creating DataSourceSet');
        await createDataSourceSet(authToken, hostname, userId, savedDataSourceSet.name);
        existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, savedDataSourceSet.name);
    }
    savedDataSourceSet.dataSources.forEach(async (savedDataSource) => {
        var dataSourceId;
        var existingDataSource = existingDataSourceSet.dataSources.find(function (x) { return x.name == savedDataSource.name; });
        if (existingDataSource == null || existingDataSource.id == null) {
            console.log('Creating DataSource');
            var createdDataSource = await createDataSource(authToken, hostname, userId, savedDataSource, existingDataSourceSet.id);
            dataSourceId = createdDataSource.id;
            existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, savedDataSourceSet.name);
            existingDataSource = existingDataSourceSet.dataSources.find(function (x) { return x.name == savedDataSource.name; });
        }
        else {
            dataSourceId = existingDataSource.id;
        }
        savedDataSource.dataSets.forEach(async (savedDataSet) => {
            var dataSetId;
            var existingDataSet = existingDataSource.dataSets.find(function (x) { return x.name == savedDataSet.name; });
            if (existingDataSet == null || existingDataSet.id == null) {
                var createdDataSet = await createDataSet(authToken, hostname, userId, savedDataSet, dataSourceId);
                dataSetId = createdDataSet.id;
                await createManualAnnotation(authToken, hostname, savedDataSet, createdDataSet);
                existingDataSourceSet = await getDataSourceSetByName(authToken, hostname, savedDataSourceSet.name);
                existingDataSource = existingDataSourceSet.dataSources.find(function (x) { return x.name == savedDataSource.name; });
                existingDataSet = existingDataSource.dataSets.find(function (x) { return x.name == savedDataSet.name; });
            }
            else {
                dataSetId = existingDataSource.dataSets.find(function (x) { return x.name == savedDataSet.name; }).id;
            }
            if (savedDataSet.annotation != null) {
                var vocab = await getVocabByName(authToken, hostname, savedDataSet.annotation.vocabulary.vocabularyName);
                var vocabKeys = await getVocabKeysForVocabId(authToken, hostname, vocab.vocabularyId);
                var savedMappedFields = savedDataSet.fieldMappings.filter((mapping) => mapping.key != "--ignore--");
                var savedIgnoredFields = savedDataSet.fieldMappings.filter((mapping) => mapping.key == "--ignore--").map(selectOriginalField);
                var existingMappedFields = existingDataSet.fieldMappings.filter((mapping) => mapping.key != "--ignore--");
                var existingIgnoredFields = existingDataSet.fieldMappings.filter((mapping) => mapping.key == "--ignore--").map(selectOriginalField);
                var ignoredFields = savedIgnoredFields.filter((mapping) => !existingIgnoredFields.includes(mapping));
                if (ignoredFields.Any()) {
                    await addIgnoredFieldsToDataSet(authToken, hostname, dataSetId, ignoredFields);
                }
                savedMappedFields.forEach(async (fieldMapping) => {
                    //Add the field if it doesn't exist
                    var match = existingMappedFields.find(function (x) { return x.originalField == fieldMapping.originalField && x.key == fieldMapping.key; });
                    if (match == null) {
                        var vocabKey = vocabKeys.find(function (x) { return x.key == fieldMapping.key; });
                        await addPropertyMappingToCluedMappingConfiguration(authToken, hostname, fieldMapping.originalField, vocabKey.vocabularyId, vocabKey.vocabularyKeyId, dataSetId);
                    }
                });
            }
        });
    });
}
async function createDataSourceSet(authToken, hostname, userId, dataSourceSetName) {
    const axios = require('axios');
    let data = JSON.stringify({
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
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.createDataSourceSet;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function createDataSource(authToken, hostname, userId, dataSource, dataSourceSetId) {
    const axios = require('axios');
    let data = JSON.stringify({
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
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.createDataSource;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function createDataSet(authToken, hostname, userId, dataSet, dataSourceId) {
    const axios = require('axios');
    let data = JSON.stringify({
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
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.createDataSet;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function createManualAnnotation(authToken, hostname, dataSet, dataSetId) {
    const axios = require('axios');
    let data = JSON.stringify({
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
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.createDataSet;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function addPropertyMappingToCluedMappingConfiguration(authToken, hostname, originalField, vocabularyId, vocabularyKeyId, dataSetId) {
    const axios = require('axios');
    let data = JSON.stringify({
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
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function addIgnoredFieldsToDataSet(authToken, hostname, dataSetId, ignoredOriginalFields) {
    var ignoredMappings = ignoredOriginalFields.map(mapIgnoreFields);
    const axios = require('axios');
    let data = JSON.stringify({
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
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function getVocabByName(authToken, hostname, vocabularyName) {
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
                        createdAt
                        createdBy
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
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.management.vocabularies.data.find(function (x) { return x.name == vocabularyName; });
    })
        .catch((error) => {
        console.log(error);
    });
}
async function getVocabKeysForVocabId(authToken, hostname, vocabularyId) {
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
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.management.vocabularyKeysFromVocabularyId.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function getDataSourceSetByName(authToken, hostname, streamName) {
    const axios = require('axios');
    let data = JSON.stringify({
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
                            connectorConfigurationId
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
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://' + hostname + '/graphql',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.inbound.dataSourceSetByName;
    })
        .catch((error) => {
        console.log(error);
    });
}
function mapIgnoreFields(item) {
    return { originalField: item, key: "--ignore--" };
}
function selectOriginalField(item) {
    return { originalField: item.originalField };
}
exports.default = { exportDataSources, importDataSources };
