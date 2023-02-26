const { reject } = require('lodash');
const { resolve } = require('path');

const fs = require('fs').promises;

async function deleteImages(imageFiles=[] , imageFolder=null) {
  
    try {
 
    const promises = imageFiles.map((fileName) => {
      return fs.unlink(imageFolder+"/"+fileName)
        .then(() => {
          console.log(`${fileName} has been deleted`);
        })
        .catch((error) => {
          console.error(`Error deleting ${fileName}: ${error}`);
        });
    });
  
    await Promise.all(promises);
    resolve(true)
    }catch(ex){
        reject(new Error("can not delete file"))
    }
  }
  
module.exports = { 
    deleteImages: deleteImages
}