export function saveToDisk(outputPath: string, folderName: string, filename: string, data: any){
    var fs = require('fs');

    var dir = outputPath + folderName;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    var json = JSON.stringify(data, replacer, 4);
    var savePath = outputPath + folderName + '/' + filename + '.json';
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

function replacer(key: string, value: string)
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
    
    else return value;
}

export function readFile(filePath: string){
    const fs = require('fs');
  
    var data = fs.readFileSync(filePath);
    return JSON.parse(data);
}

export function isEqual(obj1: any, obj2: any){
    var one = JSON.stringify(obj1, replacer);
    var two = JSON.stringify(obj2, replacer);
    var areEqual = one === two;
    // if (!areEqual) {
    //     console.log(one);
    //     console.log(two);
    // }
    return areEqual;
}
  
export default { saveToDisk, readFile, isEqual };