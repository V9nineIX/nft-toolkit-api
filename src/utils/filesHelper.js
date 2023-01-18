import fs from 'fs'

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



  module.exports = { 
    countFilesInDir: countFilesInDir,
    renameFile:  renameFile

  }