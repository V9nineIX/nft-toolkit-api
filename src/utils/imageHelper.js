const fs = require('fs').promises;

async function deleteImages(imageFiles , imageFolder) {

    const promises = imageFiles.map((fileName) => {
      return fs.unlink(imageFolder+fileName)
        .then(() => {
          console.log(`${fileName} has been deleted`);
        })
        .catch((error) => {
          console.error(`Error deleting ${fileName}: ${error}`);
        });
    });
  
    await Promise.all(promises);
  }
  
module.exports = { 
    deleteImages: deleteImages
}