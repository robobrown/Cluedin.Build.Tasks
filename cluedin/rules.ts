import utils from "./utils";

async function exportRules(authToken: string, hostname: string, outputPath: string){
    var pageNumber = 1;
    var total = 0;
    var count = 0;
   
     while (count <= total){
       var result = await exportRulesPage(pageNumber, authToken, hostname, outputPath);
       total = result.data.management.rules.total;
       count += result.data.management.rules.data.length;
       pageNumber = pageNumber + 1;
       if (count == total)
       { 
         break;
       }
    }
 }
 
 async function exportRulesPage(pageNumber: number, authToken: string, hostname: string, outputPath: string){
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
       data : data
     };
 
     return axios.request(config)
     .then((response: any) => {
       if (response.data.errors != null && response.data.errors.length > 0){
         throw new Error(response.data.errors[0].message);
       }
       for (const rule of response.data.data.management.rules.data){
             utils.saveToDisk(outputPath, "Rules", rule.name, rule)
       };
        return response.data;
     })
     .catch((error: Error) => {
       console.log(error);
     });
 }
 
 async function importRules(authToken: string, hostname: string, sourcePath: string){
  const fs = require('fs');
  const directoryPath = sourcePath + 'Rules';

  fs.readdir(directoryPath, async function (err: string, files: string[]) {
      //handling error
      if (err) {
          return console.log('Unable to scan Rules directory: ' + err);
      } 

      for (const file of files) {
        await importRule(authToken, hostname, file.replace('.json', ''), sourcePath);
      }
  });
}

async function importRule(authToken: string, hostname: string, ruleName: string, sourcePath: string){
  var savedRule = utils.readFile(sourcePath + 'Rules/' + ruleName + '.json');
  var existingRule = await getRuleByName(authToken, hostname, ruleName);

  if (existingRule == null || existingRule.id == null) {
      //create the rule
      console.log('Creating rule: ' + ruleName);
      await createRule(authToken, hostname, savedRule);
      existingRule = await getRuleByName(authToken, hostname, ruleName);
  }

  //update the rule
  var areEqual = utils.isEqual(existingRule, savedRule); 
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

async function getRuleByName(authToken: string, hostname: string, ruleName: string){
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
    data : data
  };

  return axios.request(config)
  .then((response: any) => {
      if (response.data.errors != null && response.data.errors.length > 0){
          throw new Error(response.data.errors[0].message);
      }
      return response.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}

async function activateRule(authToken: string, hostname: string, ruleId: string){
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
    data : data
  };

  return axios.request(config)
  .then((response: any) => {
      if (response.data.errors != null && response.data.errors.length > 0){
          throw new Error(response.data.errors[0].message);
      }
      return response.data;
  })
  .catch((error: Error) => {
    console.log(error);
  });
}


export default { exportRules, importRules };