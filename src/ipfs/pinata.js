const pinataSDK = require('@pinata/sdk');
const apiKey = "27e6d5907e54cb023d6c"
const apiSecretKey = "fd0fb080917d84b18589dd944dc4aeb2348c4ef88f7feea357c68227792f4505"
const fs = require('fs');
const basePath = process.cwd();


const connectPinata = async () => {
   
}


const uploadToPinata = async ({
   collectionName, 
   projectDir

}) => {

try {

const pinata = new pinataSDK({
    pinataApiKey: apiKey,
    pinataSecretApiKey:  apiSecretKey
 });


const options = {
    pinataMetadata: {
        name:collectionName
    },
    pinataOptions: {
        cidVersion: 0
    }
};


const sourcePath = basePath+'/build/images/';
const { IpfsHash}  = await pinata.pinFromFS(sourcePath, options)

console.log(IpfsHash)

//  //TODO save hash to json
//  const jsonFolder = basePath+'/build/json/'
//  let rawData =  await fs.readFileSync(basePath+'/build/json/1.txt');
//  //handle results here
//  let content = JSON.parse(rawData);
//  content.image =  `ipfs://${IpfsHash}/1.png`,
//  console.log("content" ,content)

//  fs.writeFileSync(
//     `${jsonFolder}/${1}.json`,
//     JSON.stringify(content, null, 2),
//     'utf8'
//   );


 console.log(resultJson)
}catch(ex){
    console.log(ex)
}

}

export {
    uploadToPinata
}