import fs from 'fs'
import { includes,
         isEmpty ,
         toLower  ,
         method  ,
         mapValues ,
         find ,
         findIndex,
         filter
        } from "lodash";
import { writeMetaData } from './genarate'
import { getJsonDir } from '../utils/directoryHelper'

const getMetaDirectory = (projectDir) => {
    return `./folder/${projectDir}/build/json/metadata.json`
}


const loadMetaJson = ({
    projectDir
}) => {

    return new Promise( async (resolve ,reject) => {  
     //TODO: get meta from json file
     try {
        const metadataPath  = getMetaDirectory(projectDir)
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
        resolve(metadata)
     }catch(ex){
        console.log(ex)
        reject(new Error("Can not load metadata"))
     }

    })


}

const  updateMeta = async({  projectDir=null ,edition=null , attributes=[] }) => {
    return new Promise( async (resolve ,reject) => {  
      if(!edition){
           reject(new Error("edition is require"))
      }
      try {
        const metadata =  await loadMetaJson({projectDir})
        const targetMetaDataIndex  =  findIndex(metadata, {edition: parseInt(edition)})
        metadata[targetMetaDataIndex]  =  {...metadata[targetMetaDataIndex] ,attributes:attributes }
        const jsonDir = getJsonDir(projectDir)
        //console.log(meta)

        writeMetaData(JSON.stringify(metadata ,null, 2) ,jsonDir)

      resolve(metadata)

      }catch(ex){
         console.log(ex)
      }

    })  // end promise
}

const deleteMeta = async({projectDir=null ,edition=null}) => {
    return new Promise( async (resolve ,reject) => { 

        if(!edition){
            reject(new Error("edition is require"))
       }

        try{
            const metadata =  await loadMetaJson({projectDir})
            const newMetadata = filter(metadata , (item) => item.edition != edition )
            let result = [] 
            for( const [idx ,metaItem ] of newMetadata.entries()){
                     result.push({...metaItem , edition:idx+1})
            }
            
            writeMetaData(JSON.stringify(result ,null, 2) ,getJsonDir(projectDir))

            //TODO update meta json file


            //TODO : delete image
            



          resolve(result)

        }catch(ex){
            console.log(ex)
            reject(new Error("Can delete metadata"))

        }

    })
}

module.exports = {
    updateMeta,
    loadMetaJson,
    deleteMeta 

}