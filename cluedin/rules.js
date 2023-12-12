"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("./utils"));
async function exportRules(authToken, hostname, outputPath) {
    var pageNumber = 1;
    var total = 0;
    var count = 0;
    while (count <= total) {
        var result = await exportRulesPage(pageNumber, authToken, hostname, outputPath);
        total = result.data.management.rules.total;
        count += result.data.management.rules.data.length;
        pageNumber = pageNumber + 1;
        if (count == total) {
            break;
        }
    }
}
async function exportRulesPage(pageNumber, authToken, hostname, outputPath) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `query getRules($pageNumber: Int) {
         management {
             rules(pageNumber: $pageNumber) {
                 total
                 data {
                     name
                     isActive
                     order
                     condition
                     actions
                     rules
                     scope
                 }
             }
         }
     }`,
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
        data: data
    };
    return axios.request(config)
        .then((response) => {
        if (response.data.errors != null && response.data.errors.length > 0) {
            throw new Error(response.data.errors[0].message);
        }
        response.data.data.management.rules.data.forEach((rule) => {
            utils_1.default.saveToDisk(outputPath, "Rules", rule.name, rule);
        });
        return response.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function importRules(authToken, hostname, sourcePath) {
    const fs = require('fs');
    const directoryPath = sourcePath + 'Rules';
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan Rules directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            importRule(authToken, hostname, file.replace('.json', ''), sourcePath).then((result) => {
                console.log('Rule: ' + file + ' imported.');
            });
        });
    });
}
function importRule(authToken, hostname, ruleName, sourcePath) {
    return getRuleByName(authToken, hostname, ruleName).then((existingRule) => {
        utils_1.default.readFile(sourcePath + 'Rules/' + ruleName + '.json').then((savedRule) => {
            console.log('Rule A - ' + ruleName);
        });
    });
    // let existingRule = await getRuleByName(authToken, hostname, ruleName);
    // var savedRule = await utils.readFile(sourcePath + 'Rules/' + ruleName + '.json');
    // if (existingRule == null || existingRule.id == null) {
    //     //create the rule
    //     console.log('Creating rule: ' + ruleName);
    //     await createRule(authToken, hostname, savedRule);
    //     existingRule = await getRuleByName(authToken, hostname, ruleName);
    // }
    // //update the rule
    // console.log('Updating rule: ' + ruleName);
    // await updateRule(authToken, hostname, savedRule, existingRule.id);
    // if (savedRule.isActive)
    // {
    //     console.debug('Activating rule ' + existingRule.name);
    //     await activateRule(authToken, hostname, existingRule.id);
    // }
}
async function getRuleByName(authToken, hostname, ruleName) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `query getRuleByName($name: String) {
      management {
          rules(searchName: $name) {
              total
              data {
                  id
                  name
                  isActive
                  order
                  condition
                  actions
                  rules
                  scope
              }
          }
      }
  }`,
        variables: {
            name: ruleName
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
        return response.data.data.management.rules.data.find(function (x) { return x.name == ruleName; });
    })
        .catch((error) => {
        console.log(error);
    });
}
async function createRule(authToken, hostname, savedRule) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `mutation createRule($rule: InputCreateRule!) {
      management {
        createRule(rule: $rule) {
                id
                name
            }
        }
    }`,
        variables: {
            rule: {
                name: savedRule.name,
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
        return response.data.data.management.createRule.id;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function updateRule(authToken, hostname, savedRule, ruleId) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `mutation saveRule($rule: InputRule!) {
      management {
        id
        saveRule(rule: $rule) {
          id
          name
        }
      }
    }`,
        variables: {
            rule: {
                id: ruleId,
                name: savedRule.name,
                isActive: savedRule.isActive,
                condition: savedRule.condition,
                rules: savedRule.rules,
                description: savedRule.description
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
        return response.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
async function activateRule(authToken, hostname, ruleId) {
    const axios = require('axios');
    let data = JSON.stringify({
        query: `mutation activateRule($ruleId: ID!) {
      management {
        id
        activateRule(ruleId: $ruleId) {
          id
          isActive
          order
        }
      }
    }`,
        variables: {
            ruleId: ruleId
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
        return response.data;
    })
        .catch((error) => {
        console.log(error);
    });
}
exports.default = { exportRules, importRules };
