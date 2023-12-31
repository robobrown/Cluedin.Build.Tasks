import utils from "./utils";

export async function exportRules(authToken: string, hostname: string, outputPath: string){
    let pageNumber = 1;
    let total = 0;
    let count = 0;
   
     while (count <= total){
      const result = await getRulesByPage(pageNumber, authToken, hostname);

       for (const rule of result.data){
             utils.saveToDisk(outputPath, "Rules", rule.name, rule)
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
 
 export async function importRules(authToken: string, hostname: string, sourcePath: string){
  const fs = require('fs/promises');
  const directoryPath = sourcePath + 'Rules';

  const files = await fs.readdir(directoryPath);
  for (const file of files) {
    if (file.endsWith('.json') == false) continue;
    await importRule(authToken, hostname, file.replace('.json', ''), sourcePath);
  }
}

async function importRule(authToken: string, hostname: string, ruleName: string, sourcePath: string){
  console.log('Importing Rule ' + ruleName);
  const savedRule = utils.readFile(sourcePath + 'Rules/' + ruleName + '.json');
  let existingRule = await getRuleByName(authToken, hostname, ruleName);

  if (existingRule == null || existingRule.id == null) {
      //create the rule
      console.log('Creating rule: ' + ruleName);
      await createRule(authToken, hostname, savedRule);
      existingRule = await getRuleByName(authToken, hostname, ruleName);
  }

  //update the rule
  const areEqual = utils.isEqual(existingRule, savedRule); 
  if (!areEqual) {
    console.log('Updating rule: ' + ruleName);
    await updateRule(authToken, hostname, savedRule, existingRule.id);

    if (savedRule.isActive)
    {
        console.debug('Activating rule ' + existingRule.name);
        await activateRule(authToken, hostname, existingRule.id);
    }
  }
}

async function getRulesByPage(pageNumber: number, authToken: string, hostname: string){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `query getRules($pageNumber: Int) {
      management {
          rules(pageNumber: $pageNumber) {
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
    return response.data.data.management.rules;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function getRuleByName(authToken: string, hostname: string, ruleName: string){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data.management.rules.data.find(function(x: any) { return x.name == ruleName; });
 })
 .catch((error: Error) => {
   console.log(error);
 });
}

async function createRule(authToken: string, hostname: string, savedRule: any){
  const axios = require('axios');
  const data = JSON.stringify({
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
      return response.data.data.management.createRule.id;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function updateRule(authToken: string, hostname: string, savedRule: any, ruleId: string){
  const axios = require('axios');
  const data = JSON.stringify({
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

async function activateRule(authToken: string, hostname: string, ruleId: string){
  const axios = require('axios');
  const data = JSON.stringify({
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

export async function deleteRulesByName(authToken: string, hostname: string, ruleNames: string){
  const ruleIds:string[] = [];

  if (ruleNames == "*"){
    let pageNumber = 1;
    let total = 0;
    let count = 0;
   
     while (count <= total){
      const result = await getRulesByPage(pageNumber, authToken, hostname);

       for (const rule of result.data){
         ruleIds.push(rule.id);
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
  else {
    for (const ruleName of ruleNames.split(',')) {
      const rule = await getRuleByName(authToken, hostname, ruleName);
      if (rule != null && rule.id != null) {
        ruleIds.push(rule.id);
      }
    }
  }

  await deleteRulesById(authToken, hostname, ruleIds);
}

async function deleteRulesById(authToken: string, hostname: string, ruleIds: string[]){
  for (const ruleId of ruleIds) {
    await deleteRuleById(authToken, hostname, ruleId);
  }
  
}
async function deleteRuleById(authToken: string, hostname: string, ruleId: string){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `mutation deleteRules($ruleIds: [ID]) {
      management {
          deleteRules(ruleIds: $ruleIds)
      }
  }`,
    variables: {
        ruleIds: [ruleId]
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

export default { exportRules, importRules, deleteRulesByName };