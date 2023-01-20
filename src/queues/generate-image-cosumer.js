import { startCreating , generateCollection} from '../libs/genarate'
import fsx from 'fs-extra';
import { includes } from 'lodash';
import { uploadToPinata ,uploadJson  } from '../ipfs/pinata'



const setupBuildFolder = async  (projectDir) => {
 return new Promise( async (resolve, reject) => {

    let buildFolder = null
    let jsonFolder = null

    if (projectDir) {
        buildFolder = `${projectDir}/build/image`
        jsonFolder = `${projectDir}/build/json`
        await fsx.ensureDir(buildFolder);
        await fsx.ensureDir(jsonFolder);
      }
    resolve({
        buildFolder,
        jsonFolder
    })
 })

  

}

const generateImageProcess = async (job, done) => {

  // TODO Set parameter

  const { layerConfigurations = null,
    projectDir = null,
    id = null,
    ownerId = null,
    layersElement = null,
    totalSupply = 0,
    projectName = null,
    jobType =  null
  } = job.data

  let returnData = {
    id,
    ownerId,
    "status": "Completed",
    projectDir
  }


  try {


    const { buildFolder ,  jsonFolder }  = await setupBuildFolder(projectDir)
    let res

    if(jobType == "GENERATE_COLLECTION"){

    res = await generateCollection({
            layersElement,
            totalSupply,
            projectDir,
            buildFolder,
            jsonFolder,
            job
        })   

    }else{  // narmal generate
       res = await startCreating({
      layerConfigurations,
      projectDir,
      buildFolder,
      jsonFolder,
      job
    })

    }




    //if (includes(res, "Error")) {
    if( res == "Error"){
      returnData.status = "Failed"
      done(new Error("Can not generate because total supply more than layer"), returnData)
    } else {
      //TODO upload to IPFS
//       const result =  await uploadToPinata({
//         layersElement,
//         totalSupply,
//         projectName,
//         projectDir,
//         buildFolder,
//         jsonFolder,
//         job
//       })
//     console.log(result)
//      const jsonRes =  await uploadJson(jsonFolder ,projectName)

//    console.log(jsonRes)
    //   console.log("result",  result)

      //TODO update ipfs hash to database
     console.log("done")
      done(null, returnData)


    }

  } catch (ex) {
    console.log(ex)
    returnData.status = "Failed"
    done(new Error("can not genImage"), returnData)
  }




}

export { generateImageProcess }