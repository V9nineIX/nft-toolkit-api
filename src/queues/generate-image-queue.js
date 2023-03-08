const Queue  = require('bull')
import config from "../../config";
const { redis } = config

const generateImageQueue = new Queue("generateImage" ,redis.url,{
    settings:{
        lockDuration:3600000,
        maxStalledCount:0
    }
} )

const addGenerateImageQueue = (job) => {
    generateImageQueue.add(job,{
        attempt:1,
    })
}

export {  generateImageQueue , 
          addGenerateImageQueue
}