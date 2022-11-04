import { startCreating } from '../libs/genarate'
import fsx from 'fs-extra';

const generateImageProcess = async (job ,done) => {

  // TODO Set parameter

  const { layerConfigurations=null  , 
    projectDir=null,
    id=null,
    ownerId=null
  } = job.data

  let returnData = {
    id,
    ownerId,
    "status":"completed"
 }

  try {


      let buildFolder = null
      let jsonFolder  = null

      if(projectDir) {
         buildFolder = `${projectDir}/build/image`
         jsonFolder = `${projectDir}/build/json`
        await fsx.ensureDir(buildFolder);
        await fsx.ensureDir(jsonFolder);
      }


    const res = await startCreating({
        layerConfigurations,
        projectDir,
        buildFolder,
        jsonFolder,
        job
      })

 
      
    done(null , { "result": returnData})

  }catch(ex){
      console.log(ex)
      returnData.status = "fail"
     done(new Error("can not genImage") , { "result":  returnData})
  }




}

export { generateImageProcess }