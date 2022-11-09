import { startCreating , generateCollection} from '../libs/genarate'
import fsx from 'fs-extra';
import { includes } from 'lodash';


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
    jobType =  null
  } = job.data

  let returnData = {
    id,
    ownerId,
    "status": "Completed"
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

    if (includes(res, "Error")) {
      returnData.status = "Failed"
      done(new Error("Can not generate because total supply more than layer"), returnData)
    } else {
      done(null, returnData)
    }

  } catch (ex) {
    console.log(ex)
    returnData.status = "Failed"
    done(new Error("can not genImage"), returnData)
  }




}

export { generateImageProcess }