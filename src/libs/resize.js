const fs = require('fs')
const sharp = require('sharp')

module.exports = function resize(path, format, width, height,  smallSizeFolder, forceUpdateString) {


   // Check if the file already exists in the smallSizeFolder directory
  if (fs.existsSync(smallSizeFolder) && forceUpdateString == 'false') {
    // If it does, return a readable stream to the existing file
     return fs.createReadStream(smallSizeFolder);
  }


  const readStream = fs.createReadStream(path)
  let transform = sharp()


  if (format) {
    transform = transform.toFormat(format)
  }

  if (width || height) {
    transform = transform.resize(width, height)
  }

     const writeStream = fs.createWriteStream(smallSizeFolder);
     readStream.pipe(transform).pipe(writeStream);

     return readStream
   //  return  readStream

}