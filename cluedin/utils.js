"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function saveToDisk(outputPath, folderName, filename, data) {
    var fs = require('fs');
    var dir = outputPath + folderName;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    var json = JSON.stringify(data, replacer, 4);
    var savePath = outputPath + folderName + '/' + filename + '.json';
    fs.writeFile(savePath, json, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        else {
            console.log('File: ' + savePath + ' has been saved.');
        }
    });
}
function replacer(key, value) {
    if (key == "id")
        return undefined;
    else if (key == "createdAt")
        return undefined;
    else if (key == "createdBy")
        return undefined;
    else if (key == "modifiedBy")
        return undefined;
    else if (key == "modifiedAt")
        return undefined;
    else if (key == "ownedBy")
        return undefined;
    else if (key == "organizationId")
        return undefined;
    else
        return value;
}
async function readFile(filePath) {
    const fs = require('fs/promises');
    var data = await fs.readFile(filePath);
    return JSON.parse(data);
    // .then((data: string) => {
    //     // Do something with the data
    //     return JSON.parse(data);
    // })
    // .catch((error: Error) => {
    //     // Do something if error 
    //     console.log('Error reading file: ' + filePath);
    //     console.log(error);
    // });
}
exports.default = { saveToDisk, readFile };
