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
import { getJsonDir,
       copyDirectory 
} from '../utils/directoryHelper'
import { deleteImages  } from  '../utils/imageHelper'
import { deleteFileInDir,
        renameFile
     } from  '../utils/filesHelper' 
import { COLECTION_ROOT_FOLDER } from "../constants"
import { uploadToNftStorage } from '../ipfs/nftStorage'


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




 const deleteBulkMeta = async({
    id=null
    name="",
    projectDir=null ,
    removeNumber=0 ,
    totalMint=10,   
    excludedNumber=10,
    editions=[]}) => {
    return new Promise( async (resolve ,reject) => { 

        const sourceFolder      =   `./${COLECTION_ROOT_FOLDER}/${projectDir}/build`
        const destinationFolder  =  `./${COLECTION_ROOT_FOLDER}/${projectDir}/build-v1`
    

    try {
     //TODO delete bulk image

     if( removeNumber <= 0){
        reject(false)
        throw new Error("removeNumber require")
     }
       

    const imageFolder  = getImageDirectory(projectDir)


    //copy backup dir

    const  copyStatus =    await copyDirectory(sourceFolder   , destinationFolder )
 

    // fetch meata json
    const meta  =  await loadMetaJson({projectDir})
    const metaData = [...meta]


    const removeCount = removeNumber;
    const rareCount =  excludedNumber
    const sliceItemIndex = removeCount+rareCount
    const rareItemArray = metaData.slice(-rareCount) 

    const commonItemArray = metaData.slice(0, (-sliceItemIndex)) // remove from tail

    console.log( "commonItemArray  length" ,  commonItemArray.length)


    let rareStartIndex = commonItemArray.length

    const rarefileNames = [];
    let rareStartEdition = rareItemArray[0].edition
    const  newRaraItemArray  = rareItemArray.map( (item ,idx) => {
               
                const edition =  rareStartIndex+idx
                let name = item.name
                try {
                   name =  item.name.split("#")[0]
                }catch(ex){

                }
                

                rarefileNames.push(
                    { oldName: `${imageFolder}/${item.edition}.png` , newName: `${imageFolder}/${edition}.png` }
                )
            
                item.edition =  edition  ,
                item.name =  `${name}#${edition}` 
                item.image =  `${edition}.png`
                item.rawImage =  `${imageFolder}/${edition}.png`
                

                return  item
            
            }
    )



    const newMetaData =   [...commonItemArray ,...newRaraItemArray]
    
    
    // //  //TODO : delete image
     const startDeleteNumber = rareStartEdition-removeCount
     const imageDeleteArray = Array(removeCount).fill().map((_, i) =>  `${ startDeleteNumber  + i}.png`);
     console.log("imageDeleteArray start - end",imageDeleteArray[0] , imageDeleteArray[imageDeleteArray.length-1] )


    const  resultDeleteImage  =  await deleteImages(imageDeleteArray ,imageFolder)

     console.log( resultDeleteImage )

     for( const [idx ,fileItem ] of  rarefileNames.entries()){
         await renameFile( fileItem.oldName , fileItem.newName)
     }


    //  //TODO : delete json 
    const  jsonFolder         = getJsonDirectory(projectDir)
    const  resultDeleteJson   =  await deleteFileInDir({
                                     directoryPath:jsonFolder ,
                                     excludedFiles: ["metadata.json"]
                                 })


    //TODO : save new meta
    fs.writeFileSync( `${jsonFolder}/metadata.json`, JSON.stringify(newMetaData, null, 2));



    //TODO: upload ipfs reupload

    const uploadResult = await uploadToNftStorage({
        collectionId: id,
        buildFolder: imageFolder,
        projectName: name,
        projectDir: projectDir,
        jsonFolder: jsonFolder,
      })

   console.log("uploadResult",uploadResult)



     resolve(true)

    } catch(ex){
        console.log("ex" ,ex)

        //restore file
        const  copyStatus =  await copyDirectory(destinationFolder   , sourceFolder )
 

        reject(ex)

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
    fetchToken,
    deleteBulkMeta

}