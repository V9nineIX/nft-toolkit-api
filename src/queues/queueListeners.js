import { Socket } from "socket.io";
// import { orderQueue } from "./order-queue"
import { generateImageQueue } from "./generate-image-queue";

const queueListeners = (socket=null) => {

    generateImageQueue.on('global:completed', (job, result) => {
        console.log("Job Completed: ", "Result: ", result); 
        console.log("job data" , job)

        //TODO emit  to clinent
      
    
    })

    generateImageQueue.on('global:progress',async (job, progress) => {
        console.log("job progress------" ,progress);

        const jobDetail= await generateImageQueue.getJob(job)
        const { id , ownerId}  =   jobDetail.data
    
        //TODO emit progress

        


        //TODO emit  to clinent
    })

   

}

export default queueListeners