import { NFTStorage } from 'nft.storage'
import { writeMetaForIPFS } from "../libs/metaHandler" 
import { filesFromPath } from 'files-from-path'
import  Collection  from "../models/collection.model"
import path from 'path'
import config from "../../config";
const { nftStorageKey } = config
const token = nftStorageKey.apiKey


const uploadToNftStorage = async ({
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
       
        try{
            
            const storage = new NFTStorage({ token })

            const nftImageFiles = filesFromPath(buildFolder, {
                pathPrefix: path.resolve( buildFolder), // see the note about pathPrefix below
                hidden: true, // use the default of false if you want to ignore files that start with '.'
              })


            const IpfsHash = await storage.storeDirectory( nftImageFiles )
            console.log("IpfsHash ",IpfsHash )

            await writeMetaForIPFS({ projectDir:projectDir , IpfsHash:IpfsHash})

  
            const jsonfiles = filesFromPath(jsonFolder, {
                pathPrefix: path.resolve(jsonFolder), // see the note about pathPrefix below
                hidden: true, // use the default of false if you want to ignore files that start with '.'
              })
            
             const  ipfsJsonHash = await storage.storeDirectory( jsonfiles )
            

            resolve({  ipfsImageHash:IpfsHash , ipfsJsonHash:ipfsJsonHash })

        }catch(ex){
            reject(ex)
             console.log( "error", ex)
        }

    })

} 


export {
    uploadToNftStorage 
}

