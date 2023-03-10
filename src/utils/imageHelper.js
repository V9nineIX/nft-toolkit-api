const { reject } = require('lodash');
const { resolve } = require('path');
const sharp = require('sharp');

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

async function getImagePathByTokenId({ imageFolder=null , tokenId=0 }){
   try {
      

   }catch(ex){
    reject(new Error("image not found"))
   }

}

async function mergeImage({ 
    frontImage = null,
    backImage = null,
    resultImage = null

 }){
 
    const front = sharp(frontImage)
    const back = sharp(backImage)


    await sharp( backImage)
      .composite([
        {
          input: frontImage ,
        },
      ])
      .toFile(resultImage);
 
 }
  
module.exports = { 
    deleteImages: deleteImages,
    mergeImage: mergeImage
}