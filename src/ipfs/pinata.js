const pinataSDK = require('@pinata/sdk');
// const apiKey = "27e6d5907e54cb023d6c"
// const apiSecretKey = "fd0fb080917d84b18589dd944dc4aeb2348c4ef88f7feea357c68227792f4505"
const fs = require('fs');
const basePath = process.cwd();
import {   addMetadata } from "../libs/genarate"
import config from "../../config";
const { pinataKey } = config
import { writeMetaForIPFS } from "../libs/metaHandler" 
import  Collection  from "../models/collection.model"


const connectPinata = async () => {
   
}


const uploadJson = async(jsonFolder ,projectName , JWTKey=null) => {
    return new Promise( async (resolve ,reject) => {



    if(JWTKey) {
    let pinata = new pinataSDK({ pinataJWTKey: JWTKey})
    }else{

        const { apiKey ,apiSecretKey } =  pinataKey
        pinata = new pinataSDK({
                pinataApiKey: apiKey,
                pinataSecretApiKey: apiSecretKey
        });

    }

 

  


    const optionsForJson = {
        pinataMetadata: {
            name: "json-"+projectName
        },
        pinataOptions: {
            cidVersion: 0
        }
    };

    const jsonIpfs  = await pinata.pinFromFS(jsonFolder, optionsForJson)
    resolve(jsonIpfs )
   })

}


const uploadToPinata = async ({
   collectionId,
   layersElement,
   totalSupply,
   projectName,
   projectDir,
   buildFolder,
   jsonFolder,
   JWTKey = null
}) => {
    return new Promise( async (resolve ,reject) => {
      
    let  pinata = null
     if(JWTKey) {
       // console.log(JWTKey)
        pinata = new pinataSDK({ pinataJWTKey:  JWTKey});
     }else{
        const { apiKey ,apiSecretKey } =  pinataKey 
        pinata = new pinataSDK({
                pinataApiKey: apiKey,
                pinataSecretApiKey:  apiSecretKey
        });
     }


        try {

 
        const options = {
            pinataMetadata: {
                name: projectDir
            },
            pinataOptions: {
                cidVersion: 0
            }
        };


        const sourcePath = buildFolder;
        // console.log(sourcePath)
        const { IpfsHash}  = await pinata.pinFromFS(sourcePath, options)
     
     

         await writeMetaForIPFS({ projectDir:projectDir , IpfsHash:IpfsHash})


   



        //TODO upload json to IPFS

        const optionsForJson = {
            pinataMetadata: {
                name: "json-"+projectDir
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        const { IpfsHash: ipfsJsonHash}  = await pinata.pinFromFS(jsonFolder, optionsForJson)
         


        resolve({  ipfsImageHash:IpfsHash , ipfsJsonHash:ipfsJsonHash })

       // console.log(resultJson)
        }catch(ex){
            // await pinata.unpin(IpfsHash)
            reject(ex)
            console.log(ex)
        }


   })

}

export {
    uploadToPinata,
    uploadJson
}