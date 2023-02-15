import fs from 'fs'
import fsx from 'fs-extra'
import { includes,
         isEmpty ,
         toLower  ,
         method  ,
         mapValues ,
         find ,
         findIndex,
         filter ,
         pull
        } from "lodash";
import { writeMetaData ,addMetadata } from './genarate'
import { getJsonDir } from '../utils/directoryHelper'


const getMetaDirectory = (projectDir) => {
    return `./folder/${projectDir}/build/json/metadata.json`
}

const getImageDirectory = (projectDir) => {
    return `./folder/${projectDir}/build/image`
}

const getJsonDirectory = (projectDir) => {
    return `./folder/${projectDir}/build/json`
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

const  updateMeta = async({  projectDir=null ,edition=null , attributes=[] ,customAttributes=[] }) => {
    return new Promise( async (resolve ,reject) => {  
      if(!edition){
           reject(new Error("edition is require"))
      }
      try {
        const metadata =  await loadMetaJson({projectDir})
        const targetMetaDataIndex  =  findIndex(metadata, {edition: parseInt(edition)})
        metadata[targetMetaDataIndex]  =  {...metadata[targetMetaDataIndex] ,attributes:attributes ,customAttributes:customAttributes }
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
           // let rawImage = null
            for( const [idx ,metaItem ] of newMetadata.entries()){
                     result.push({...metaItem , edition:idx+1})
            }
            
            //TODO update meta json file
            writeMetaData(JSON.stringify(result ,null, 2) ,getJsonDir(projectDir))

            //TODO : delete image
            const removeImagePath = getImageDirectory(projectDir)+edition+".png"
            await fsx.remove(removeImagePath)



          resolve(result)

        }catch(ex){
            console.log(ex)
            reject(new Error("Can delete metadata"))

        }

    })
 }

 const writeMetaForIPFS = ({ projectDir=null , IpfsHash=null }) => {
    return new Promise( async (resolve ,reject) => { 
        try {
            const metadata   =  await loadMetaJson({projectDir})
            const jsonFolder =  getJsonDirectory(projectDir)

            for (const [index, meta] of  metadata.entries() ) {

                await addMetadata(
                             null, 
                             index ,
                             jsonFolder,
                             meta,
                             IpfsHash,
                             [],
                             "json"
                          )
     
              } // end loop

            resolve(true)

        }catch(ex){
            reject(new Error("Can not wirte metadata"))
        }


    })

 }

 const updateMetaQty = ({ projectDir=null , metaParam=[] }) => {
    return new Promise( async (resolve ,reject) => { 
     
    try {

        const metadata   =  await loadMetaJson({projectDir})
        for (const [index, meta] of metaParam.entries() ) {
            
         let  metaIndex =  findIndex(metadata , {'edition' : meta.edition} )
          metadata[metaIndex] = { ...metadata[metaIndex] , qty:meta.qty}
        } // end for

       writeMetaData(JSON.stringify(metadata ,null, 2) ,getJsonDir(projectDir))
       resolve(true)
       
    }catch(ex){
        console.log("ex",ex)
        reject(new Error("Can not update metadata"))
    }



    })
}

const fetchMeta = ({
    projectDir =null,
    offset = 0,
    limit = null,
    filter =[]

}) => {
    return new Promise( async (resolve ,reject) => { 
    let returnData = {
            totalImage : 0 ,
            meta : []
        }

    try {

        const metadata  =  await loadMetaJson({projectDir})


   
        ///Filter
        if (!isEmpty(filter)) {

          let filterMetaData = []


          for (const [index, meta] of metadata.entries()) {
         

            let isMatch = false
            let matchCount = 0

            for (const filterObject of filter) {

              const filterValue = mapValues(filterObject.value, method('toLowerCase')); //value:["body magic","bacgord"]


              for (const attr of meta.attributes) {

                if (toLower(attr.trait_type) == toLower(filterObject.key)) {
                  if (!isEmpty(filterValue)) {
                    if (includes(filterValue, toLower(attr.value))) { // []

                    //   filterMetaData.push(meta)
                         matchCount++
                    //  isMatch = true

                    }
                  }
                }
                // if (isMatch) { // exit loop
                //   break
                // }
              }
            //   if (isMatch) { // exit loop
            //     break
            //   }

            } // end loop filter
        
         

            if( matchCount == filter.length){
                 filterMetaData.push(meta)
             }

          } // end loop

          returnData.totalImage = filterMetaData.length
          if (limit) {
            returnData.meta = [...filterMetaData].slice(offset, limit)
          } else {
            returnData.meta = [...filterMetaData]
          }


        } // end if
        else {
            returnData.totalImage = metadata.length
          if (limit) {
            returnData.meta = [...metadata].slice(offset, limit)
          } else {
            returnData.meta = [...metadata]
          }
        }

      } catch (ex) {
        console.log("error", ex)
        returnData.totalImage = 0
        resolve(returnData)
      }
  
      resolve(returnData)

    })
    
}



const fetchToken = ({
    projectDir =null,
    offset = 0,
    limit = null,
    filter = [],
    filterId = []

}) => {
    return new Promise( async (resolve ,reject) => { 
    let returnData = {
            totalImage : 0 ,
            meta : []
        }

    try {

     
        const metadata  =  await loadMetaJson({projectDir})
   

          let filterMetaData = []
          let filterIdArray = [...filterId]


          for (const [index, meta] of metadata.entries()) {

          let isMatch = false
          let matchCount = 0

          if (!isEmpty(filter)) {
             for (const filterObject of filter) {

              const filterValue = mapValues(filterObject.value, method('toLowerCase')); //value:["body magic","bacgord"]


              for (const attr of meta.attributes) {

               

                if (toLower(attr.trait_type) == toLower(filterObject.key)) {
                  if (!isEmpty(filterValue)) {
                    if (includes(filterValue, toLower(attr.value))) {

                        // const metaAttr = await convertAttrToTrait(meta)
                        // filterMetaData.push(convertToToken(meta, metaAttr))
                        // isMatch = true

                        matchCount++

                    }
                  }
                }
                if (isMatch) { // exit loop
                  break
                }
              }

            //   if (isMatch) { // exit loop
            //     break
            //   }

               if( matchCount == filter.length){
                   const metaAttr = await convertAttrToTrait(meta)
                   filterMetaData.push(convertToToken(meta, metaAttr))
                }

             } // if filter
          }else{


            if(!isEmpty(filterId)){ // if has filterId

                if(isEmpty(filterIdArray)){
                    break; // exit if filter comlplete
                }
                
                if(filterIdArray.includes(parseInt(meta.edition))){
                   
                    const metaAttr = await convertAttrToTrait(meta)
                    filterMetaData.push(convertToToken(meta, metaAttr))

                    filterIdArray = pull(filterIdArray ,parseInt(meta.edition) )  // pop out if match 
                   
                }



            }else{

                 const metaAttr = await convertAttrToTrait(meta)
                 filterMetaData.push(convertToToken(meta, metaAttr))
            }


          
          }


        } // end loop meta
        // console.log("  filterMetaData",  filterMetaData)

          returnData.totalImage = filterMetaData.length
          if (limit) {
            returnData.meta = [...filterMetaData].slice(offset, limit)
          } else {
            returnData.meta = [...filterMetaData]
          }

      } catch (ex) {
        console.log("error", ex)
        returnData.totalImage = 0
        resolve(returnData)
      }
  
      resolve(returnData)

    })
    
}



const convertToToken = (meta, metaAttr) => {
    return {
        id:  meta.edition,
        tokenID: meta.edition,
        tokenURI: "",
        ipfsURI: "",
        image: meta.rawImage,
        name: meta.name,
        description: meta.description,
        updatedAtTimestamp: meta.date,
        owner: {id:"" ,tokens:[] },
        metas:  metaAttr

    }
}


const convertAttrToTrait = (meta) => {

    return new Promise( async (resolve ,reject) => { 
      
        let metaAttr = []
        try {

            for (const attr of meta.attributes) {

                const trait_type =   attr.trait_type.replaceAll(' ', '_')
                const value      =   attr.value.replaceAll(' ', '_')   
    
                metaAttr.push({
                    "id": `${meta.edition}.${trait_type}.${value}`,
                    "traitType": trait_type ,
                    "value": value 
                })
    
            }
            resolve(metaAttr)

        }catch(ex){
            reject(ex)

        }

    })
    
} 




module.exports = {
    updateMeta,
    loadMetaJson,
    deleteMeta,
    writeMetaForIPFS,
    updateMetaQty,
    fetchMeta ,
    fetchToken

}