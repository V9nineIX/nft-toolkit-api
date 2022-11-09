const  throng = require('throng');
import { generateImageQueue }  from './queues/generate-image-queue'
import { generateImageProcess } from "./queues/generate-image-cosumer";


// Connect to a local redis instance locally, and the Heroku-provided URL in production


// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
const  workers =  process.env.WEB_CONCURRENCY || 2;

// The maximum number of jobs each worker should process at once. This will need
// to be tuned for your application. If each job is mostly waiting on network 
// responses it can be much higher. If each job is CPU-intensive, it might need
// to be much lower.
let maxJobsPerWorker = 50;

function start() {
   

    
   console.log("worker start")
//    orderQueue.process(orderProcess)

   generateImageQueue.process(maxJobsPerWorker, async (job ,done) => {


      generateImageProcess(job,done)
       

   })

}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });