const Queue  = require('bull')
import config from "../../config";
const { redis } = config

const generateImageQueue = new Queue("generateImage" ,redis.url)

const addGenerateImageQueue = (job) => {
    generateImageQueue.add(job,{
        attempt:2,
    })
}

export {  generateImageQueue , 
          addGenerateImageQueue
}