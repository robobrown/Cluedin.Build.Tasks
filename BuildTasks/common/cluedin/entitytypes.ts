import utils from "./utils";
import pagetemplate from './pagetemplate'

export async function exportEntityTypes(authToken: string, hostname: string, outputPath: string, entityTypeNames: string){
  if (entityTypeNames != null && entityTypeNames != "*"){
    for(const entityType of entityTypeNames.split(',')){
        const entityTypeDetails = await getEntityTypeByName(authToken, hostname, entityType);
        if (entityTypeDetails == null){
            throw new Error('EntityTypes not found: ' + entityType);
        }
        utils.saveToDisk(outputPath, "EntityTypes", entityType, entityTypeDetails)
    }
  }
  else if (entityTypeNames == "*") {
    let pageNumber = 1;
    let total = 0;
    let count = 0;
   
     while (count <= total){
       const result = await getEntityTypesByPage(authToken, hostname, pageNumber);

       for (const entityType of result.data){
            if (entityType.entityType == "/Account" || entityType.entityType == "/Accounting" || entityType.entityType == "/Accounting/CostCenter" || entityType.entityType == "/Accounting/Group"
            || entityType.entityType == "/Activity" || entityType.entityType == "/Album" || entityType.entityType == "/Announcement" || entityType.entityType == "/Infrastructure/Application"
            || entityType.entityType == "/Files/CompressedFileArchive" || entityType.entityType == "/Document/Audio" || entityType.entityType == "/Planning/Scrum/BacklogItem" || entityType.entityType == "/Finance/BankAccount"
            || entityType.entityType == "/SourceCode/Branch" || entityType.entityType == "/SourceCode/Build" || entityType.entityType == "/Calendar" || entityType.entityType == "/Temporal/Century"
            || entityType.entityType == "/SourceCode/ChangeSet" || entityType.entityType == "/SourceCode/Changeset" || entityType.entityType == "/Channel" || entityType.entityType == "/Geography/City"
            || entityType.entityType == "/Provider/Root" || entityType.entityType == "/Infrastructure/Cloud" || entityType.entityType == "/SourceCode/File" || entityType.entityType == "/Comment"
            || entityType.entityType == "/Organization/Competitor" || entityType.entityType == "/Infrastructure/Host/Computer" || entityType.entityType == "/Infrastructure/Contact" || entityType.entityType == "/Infrastructure/Conversation"
            || entityType.entityType == "/Geography/Country" || entityType.entityType == "/Payment/Card/CreditCard" || entityType.entityType == "/Document/Database" || entityType.entityType == "/Document/Template/Database"
            || entityType.entityType == "/Temporal/Date" || entityType.entityType == "/Temporal/Decade" || entityType.entityType == "/Planning/Scrum/DefinitionOfDone" || entityType.entityType == "/Organization/Department"
            || entityType.entityType == "/SourceCode/Deployment" || entityType.entityType == "/Deployment" || entityType.entityType == "/Document/Diagram" || entityType.entityType == "/Image/Diagram"
            || entityType.entityType == "/Files/Directory" || entityType.entityType == "/Infrastructure/DirectoryItem" || entityType.entityType == "/Discussion" || entityType.entityType == "/Document"
            || entityType.entityType == "/Document/Document" || entityType.entityType == "/Document/Discussion" || entityType.entityType == "/Infrastructure/List/DocumentLibrary" || entityType.entityType == "/Document/Template/Document"
            || entityType.entityType == "/Infrastructure/Domain" || entityType.entityType == "/Planning/Scrum/Epic" || entityType.entityType == "/Calendar/Event" || entityType.entityType == "/FAQ"
            || entityType.entityType == "/Files/File" || entityType.entityType == "/Infrastructure/Folder" || entityType.entityType == "/Form" || entityType.entityType == "/Infrastructure/List/GenericList"
            || entityType.entityType == "/Infrastructure/Group" || entityType.entityType == "/Infrastructure/Policy" || entityType.entityType == "/Idea" || entityType.entityType == "/Industry"
            || entityType.entityType == "/Issue" || entityType.entityType == "/Infrastructure/List/Issue" || entityType.entityType == "/Planning/Iteration" || entityType.entityType == "/Planning/KanbanBoard"
            || entityType.entityType == "/Infrastructure/Host/Laptop" || entityType.entityType == "/Infrastructure/License" || entityType.entityType == "/Links" || entityType.entityType == "/List" 
            || entityType.entityType == "/List/ListItem" || entityType.entityType == "/Infrastructure/Location" || entityType.entityType == "/Mail" || entityType.entityType == "/Mail/Folder"
            || entityType.entityType == "/Marketing/Ad" || entityType.entityType == "/Marketing/Campaign" || entityType.entityType == "/Calendar/Meeting" || entityType.entityType == "/Temporal/Millennium"
            || entityType.entityType == "/Temporal/Month" || entityType.entityType == "/Infrastructure/NetworkAddress" || entityType.entityType == "/News" || entityType.entityType == "/Note"
            || entityType.entityType == "/Organization" || entityType.entityType == "/Partner" || entityType.entityType == "/Person" || entityType.entityType == "/Marketing/Persona" || entityType.entityType == "/PhoneCall"
            || entityType.entityType == "/PhoneNumber" || entityType.entityType == "/Image/Photograph" || entityType.entityType == "/Picture" || entityType.entityType == "/Image"
            || entityType.entityType == "/Document/Picture" || entityType.entityType == "/Document/PlainText" || entityType.entityType == "/Infrastructure/Position" || entityType.entityType == "/Document/Presentation"
            || entityType.entityType == "/Document/Template/Presentation" || entityType.entityType == "/Process" || entityType.entityType == "/ProcessStage"|| entityType.entityType == "/Product"
            || entityType.entityType == "/Planning/Scrum/Role/ProductOwner" || entityType.entityType == "/Project" || entityType.entityType == "/Planning/ProjectPlan" || entityType.entityType == "/SourceCode/PullRequest"
            || entityType.entityType == "/Temporal/Quarter" || entityType.entityType == "/Question" || entityType.entityType == "/Document/Report" || entityType.entityType == "/SourceCode/Repository"
            || entityType.entityType == "/Sales/Sale" || entityType.entityType == "/Sales/Contract" || entityType.entityType == "/Sales/Deal"
            || entityType.entityType == "/Sales/Lead" || entityType.entityType == "/Sales/Oppurtunity" || entityType.entityType == "/Sales/Opportunity" || entityType.entityType == "/Sales/Order"
            || entityType.entityType == "/Sales/Quote" || entityType.entityType == "/Planning/Scrum/Role/ScrumMaster" || entityType.entityType == "/Planning/Scrum" || entityType.entityType == "/Infrastructure/Host/Server"
            || entityType.entityType == "/Infrastructure/Site" || entityType.entityType == "/Skill" || entityType.entityType == "/Sms" || entityType.entityType == "/Comment/Social"
            || entityType.entityType == "/SourceCode" || entityType.entityType == "/Document/Spreadsheet" || entityType.entityType == "/Document/Template/Spreadsheet" || entityType.entityType == "/Planning/Scrum/Sprint"
            || entityType.entityType == "/Planning/Scrum/SprintRetrospective" || entityType.entityType == "/Planning/Scrum/SprintReview" || entityType.entityType == "/Support/Entitlement"
            || entityType.entityType == "/Support/Ticket" || entityType.entityType == "/Infrastructure/List/Survey" || entityType.entityType == "/Tag" || entityType.entityType == "/Task"
            || entityType.entityType == "/Template" || entityType.entityType == "/Document/Template" || entityType.entityType == "/Infrastructure/Tenant"
            || entityType.entityType == "/Mail/Thread" || entityType.entityType == "/Topic" || entityType.entityType == "/Unknown" || entityType.entityType == "/Infrastructure/User"
            || entityType.entityType == "/Document/Video" || entityType.entityType == "/WebPage" || entityType.entityType == "/Web/Page" || entityType.entityType == "/WebSite"
            || entityType.entityType == "/Temporal/Week" || entityType.entityType == "/Planning/Workspace" || entityType.entityType == "/Temporal/Year")
            {
              // Excluded the built in system type
              continue;
            }

            utils.saveToDisk(outputPath, "EntityTypes", entityType.displayName, entityType)
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
}
 
async function getEntityTypeByName(authToken: string, hostname: string, entityName: string){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `query entityTypeLayoutConfigurations(
        $searchName: String
        $pageNumber: Int
        $pageSize: Int
    ) {
        management {
            entityTypeConfigurations(
                searchName: $searchName
                pageNumber: $pageNumber
                pageSize: $pageSize
            ) {
                data {
                    active
                    displayName
                    entityType
                    icon
                    id
                    path
                    route
                    type
                    pageTemplate {
                        displayName
                        name
                    }
                }
                total
            }
        }
    }
    
  `,
    variables: {
      pageNumber: 1,
      pageSize: 20,
      searchName: entityName
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
    
    return response.data.data.management.entityTypeConfigurations.data.find(function(x: any) { return x.displayName == entityName; });
  })
  .catch((error: Error) => {
    throw error;
  });
}

export async function importEntityTypes(authToken: string, hostname: string, sourcePath: string) {
  const fs = require('fs');
  const directoryPath = sourcePath + 'EntityTypes';
  
  if (!fs.existsSync(directoryPath)){
    return;
  }

  const files = await fs.readdirSync(directoryPath);
  for (const file of files) {
    if (file.endsWith('.json') == false) continue;
    await importEntityTypeConfiguration(authToken, hostname, file.replace('.json', ''), sourcePath);
  }
}

async function importEntityTypeConfiguration(authToken: string, hostname: string, entityTypeName: string, sourcePath: string){
  console.log('Importing EntityType ' + entityTypeName);
  let existingItem = await getEntityTypeByName(authToken, hostname, entityTypeName);
  const savedItem = utils.readFile(sourcePath + 'EntityTypes/' + entityTypeName + '.json');

  const pageTemplate = await pagetemplate.getPageTemplateByName(authToken, hostname, savedItem.pageTemplate.name);

  if (existingItem == null || existingItem.id == null) {
      console.log('Creating Entity type Configuration');
      await createEntityTypeConfiguration(authToken, hostname, savedItem, pageTemplate);
      existingItem = await getEntityTypeByName(authToken, hostname, entityTypeName);
  }
  
  const areEqual = utils.isEqual(existingItem, savedItem); 
  if (!areEqual) {
    console.log(existingItem);
    console.log(savedItem);
    console.log('Updating Entity Type Configuration ' + savedItem.displayName);
    await updateEntityTypeConfiguration(authToken, hostname, savedItem, existingItem.id, pageTemplate);
  }
}

async function createEntityTypeConfiguration(authToken: string, hostname: string, entitytype: any, pageTemplate: any){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `mutation saveEntityTypeConfiguration(
      $entityTypeConfiguration: InputEntityTypeLayoutConfiguration!
  ) {
      management {
          id
          saveEntityTypeConfiguration(entityTypeConfiguration: $entityTypeConfiguration) {
              id
          }
      }
  }
  `,
    variables: {
      entityTypeConfiguration: {
            displayName: entitytype.displayName,
            icon: entitytype.icon,
            route: entitytype.route,
            path: entitytype.path,
            entityType: entitytype.entityType,
            type: entitytype.type,
            layoutConfiguration: pageTemplate.pageTemplateId,
            pageTemplateId: pageTemplate.pageTemplateId,
            active: entitytype.active
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

async function updateEntityTypeConfiguration(authToken: string, hostname: string, savedEntityTypeConfiguration: any, entitytypeConfigurationId: string, pageTemplate: any){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `mutation saveEntityTypeConfiguration(
      $entityTypeConfiguration: InputEntityTypeLayoutConfiguration!
  ) {
      management {
          id
          saveEntityTypeConfiguration(entityTypeConfiguration: $entityTypeConfiguration) {
              id
          }
      }
  }
  `,
    variables: {
      entityTypeConfiguration: {
            id: entitytypeConfigurationId,
            displayName: savedEntityTypeConfiguration.displayName,
            icon: savedEntityTypeConfiguration.icon,
            route: savedEntityTypeConfiguration.route,
            path: savedEntityTypeConfiguration.path,
            entityType: savedEntityTypeConfiguration.entityType,
            type: savedEntityTypeConfiguration.type,
            layoutConfiguration: pageTemplate.pageTemplateId,
            pageTemplateId: pageTemplate.pageTemplateId,
            active: savedEntityTypeConfiguration.active
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

async function getEntityTypesByPage(authToken: string, hostname: string, pageNumber: number){
  const axios = require('axios');
  const data = JSON.stringify({
    query: `query entityTypeLayoutConfigurations(
      $pageNumber: Int
      $pageSize: Int
  ) {
      management {
          entityTypeConfigurations(
              pageNumber: $pageNumber
              pageSize: $pageSize
          ) {
              data {
                  active
                  displayName
                  entityType
                  icon
                  id
                  path
                  route
                  type
                  pageTemplate {
                      displayName
                      name
                  }
              }
              total
          }
      }
  }
  `,
    variables: {
      pageNumber: pageNumber,
      pageSize: 200
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
     return response.data.data.management.entityTypeConfigurations;
  })
  .catch((error: Error) => {
    throw error;
  });
}

export default { exportEntityTypes, importEntityTypes };

