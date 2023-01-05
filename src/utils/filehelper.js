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