import fs from 'fs'
const fse = require('fs-extra');

function countFilesInDir(dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files.length);
        }
      });
    });
  }

function renameFile(original , dest) {
    return new Promise((resolve, reject) => {
      fs.rename(original ,dest ,
        (err, files) => {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
        })

    })
}

 async function  deleteFileInDir({
    directoryPath=null,
    excludedFiles=[]}
){
    return new Promise( async  (resolve, reject) => {
        const fsPromises = fs.promises;
        console.log("directoryPath",directoryPath)
        fs.readdir(directoryPath, async (err, files) => {
            if (err) {
                console.log("err",err)
                throw err;
            }

            // Filter out excluded files
            const filesToDelete = files.filter(file => !excludedFiles.includes(file));


            const promises = filesToDelete.map(file =>
                fsPromises.unlink(directoryPath+"/"+file)
                .then(() => console.log(`Deleted file: ${file}`))
            )

            await Promise.all(promises)

            resolve(true)

        }); //  end read dir
    })


}


async function deleteFolder(folderPath) {
  try {
    await fse.remove(folderPath);
    console.log(`Folder ${folderPath} deleted successfully`);
  } catch (err) {
    console.error(`Error deleting folder ${folderPath}: ${err}`);
  }
}



  module.exports = { 
    countFilesInDir: countFilesInDir,
    renameFile:  renameFile,
    deleteFileInDir:  deleteFileInDir,
    deleteFolder: deleteFolder
    

  }