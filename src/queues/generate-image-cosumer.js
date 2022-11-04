import { startCreating } from '../libs/genarate'

const generateImageProcess = async (job ,done) => {

  // TODO Set parameter
  try {
      const { layerConfigurations=null } = job.data
      const res = await startCreating({ layerConfigurations ,job })
      
      done(null , { "result": res})
  }catch(ex){
      console.log(ex)
     done(new Error("can not genImage") , { "result": "fail"})
  }




}

export { generateImageProcess }