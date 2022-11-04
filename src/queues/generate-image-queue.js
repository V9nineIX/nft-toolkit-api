const Queue  = require('bull')
import config from "../../config";
const { redis } = config

console.log(redis.host+":"+redis.port)


const REDIS_URL = 'redis://'+redis.host+":"+redis.port
console.log(REDIS_URL )

const generateImageQueue = new Queue("generateImage" ,REDIS_URL )

const addGenerateImageQueue = (job) => {
    generateImageQueue.add(job,{
        attempt:2,
    })
}

export {  generateImageQueue , 
          addGenerateImageQueue
}