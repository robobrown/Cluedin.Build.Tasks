export function saveToDisk(outputPath: string, folderName: string, filename: string, data: any){
    /* eslint-disable */
    const fs = require('fs');

    const dir = outputPath + folderName;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    const json = JSON.stringify(data, saveReplacer, 4);
    const savePath = outputPath + folderName + '/' + filename + '.json';
    fs.writeFile(savePath, json, 'utf8',
    function (err: any) {
          if (err) {
              console.log("An error occured while writing JSON Object to File.");
              return console.log(err);
          }
          else{
            console.log('File: ' + savePath + ' has been saved.');
          }
      });
}

//Fields here do note get saved when writing the JSON files
function saveReplacer(key: string, value: string)
{
    if (key=="id") return undefined;
    else if (key=="createdAt") return undefined;
    else if (key=="createdBy") return undefined;
    else if (key=="modifiedBy") return undefined;
    else if (key=="modifiedAt") return undefined;
    else if (key=="ownedBy") return undefined;
    else if (key=="organizationId") return undefined;
    else if (key=="updatedAt") return undefined;
    else if (key=="vocabularyId") return undefined;
    else if (key=="vocabularyKeyId") return undefined;    
    else if (key=="pageTemplateId") return undefined;
    else if (key=="layoutConfiguration") return undefined;
    else if (key=="annotationId") return undefined;
    else if (key=="annotationEdgeId") return undefined;
    
    else return value;
}

//Fields here do not get compared with one another
function compareReplacer(key: string, value: string)
{
    if (key=="id") return undefined;
    else if (key=="createdAt") return undefined;
    else if (key=="createdBy") return undefined;
    else if (key=="modifiedBy") return undefined;
    else if (key=="modifiedAt") return undefined;
    else if (key=="ownedBy") return undefined;
    else if (key=="organizationId") return undefined;
    else if (key=="updatedAt") return undefined;
    else if (key=="vocabularyId") return undefined;
    else if (key=="pageTemplateId") return undefined;
    else if (key=="layoutConfiguration") return undefined;
    else if (key=="annotationId") return undefined;
    else if (key=="annotationEdgeId") return undefined;
    else if (key=="vocabularyKeyId") return undefined;
    else if (key=="order") return undefined;

    //These next 2 fields are on the annotation even tho they are removed on the UI, but the value useAsEntityCode is set to false
    else if (key=="useSourceCode") return undefined;
    else if (key=="entityCodeOrigin") return undefined;

    //edges are compared separately
    else if (key=="annotationEdges") return undefined;
    // else if (key=="edgeProperties") return undefined;

    //Annotation Properties are not created directly, they are created via the mapped fields, 
    //we had a situation where the dev environment had additional properties because the mapping was created then removed from the field
    else if (key=="annotationProperties") return undefined;

    //Streams account ID
    else if (key=="accountId") return undefined;
    
    else return value;
}


export function readFile(filePath: string){
    /* eslint-disable */
    const fs = require('fs');
  
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

export function isEqual(obj1: any, obj2: any){
    const one = JSON.stringify(obj1, compareReplacer);
    const two = JSON.stringify(obj2, compareReplacer);
    const areEqual = one === two;
    return areEqual;
}

export default { saveToDisk, readFile, isEqual };