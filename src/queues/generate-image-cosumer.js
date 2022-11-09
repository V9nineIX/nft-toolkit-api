import { startCreating } from '../libs/genarate'
import fsx from 'fs-extra';
import { includes } from 'lodash';

const generateImageProcess = async (job, done) => {

  // TODO Set parameter

  const { layerConfigurations = null,
    projectDir = null,
    id = null,
    ownerId = null
  } = job.data

  let returnData = {
    id,
    ownerId,
    "status": "Completed"
  }


  try {


    let buildFolder = null
    let jsonFolder = null

    if (projectDir) {
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