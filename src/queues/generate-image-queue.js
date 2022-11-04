const Queue  = require('bull')

const generateImageQueue = new Queue("orders" , {
    redis:  process.env.SERVER_IP+":6379"
})

const addGenerateImageQueue = (job) => {
    generateImageQueue.add(job,{
        attempt:2,
    })
}

export {  generateImageQueue , 
          addGenerateImageQueue
}