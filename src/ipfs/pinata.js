const pinataSDK = require('@pinata/sdk');
const apiKey = "27e6d5907e54cb023d6c"
const apiSecretKey = "fd0fb080917d84b18589dd944dc4aeb2348c4ef88f7feea357c68227792f4505"
const fs = require('fs');
const basePath = process.cwd();
import {   addMetadata } from "../libs/genarate"


const connectPinata = async () => {
   
}


const uploadJson = async(jsonFolder ,projectName) => {
    return new Promise( async (resolve ,reject) => {

    const pinata = new pinataSDK({
            pinataApiKey: apiKey,
            pinataSecretApiKey:  apiSecretKey
    });

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
   layersElement,
   totalSupply,
   projectName,
   projectDir,
   buildFolder,
   jsonFolder,
   job
}) => {
    return new Promise( async (resolve ,reject) => {
        try {

        const pinata = new pinataSDK({
            pinataApiKey: apiKey,
            pinataSecretApiKey:  apiSecretKey
        });


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
          console.log("IpfsHash",IpfsHash)
         let editionCount = 1

         const metadata = JSON.parse(fs.readFileSync(`./folder/${projectDir}/build/json/metadata.json`, 'utf-8'));
         
         for (const [index, meta] of  metadata.entries() ) {

        //    await addMetadata(
        //                 null, 
        //                 index+1 ,
        //                 jsonFolder,
        //                 meta,
        //                 IpfsHash,
        //                 [],
        //                 "txt"
        //                 )
            // fs.renameSync(
            //     `./folder/${projectDir}/build/json/${index+1}.txt`
            //     `./folder/${projectDir}/build/json/${index+1}.json`
            // )

         } // end loop

            //  fs.renameSync(
            //     `./folder/${projectDir}/build/json/${1}.txt`
            //     `./folder/${projectDir}/build/json/${1}.json`
            // )


        // while (editionCount <= totalSupply)
        // for (const item of layersElement) 
        // {
        //     const { dna ,metaData} = layersElement[editionCount-1]
        //     const statusFile =   await addMetadata(dna, 
        //                 editionCount ,
        //                 jsonFolder,
        //                 metaData,
        //                 IpfsHash)
        //     editionCount++
        //    // console.log(statusFile)
        // } //end while

        //TODO upload json to IPFS

        const optionsForJson = {
            pinataMetadata: {
                name: "json-"+projectDir
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

    //    const jsonIpfs  = await pinata.pinFromFS(jsonFolder, optionsForJson)

        // console.log("json",  jsonIpfsHash)
         
        resolve({   IpfsHash  })

       // console.log(resultJson)
        }catch(ex){
          // await pinata.unpin(IpfsHash)
            console.log(ex)
        }


   })

}

export {
    uploadToPinata,
    uploadJson
}