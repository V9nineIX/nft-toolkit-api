import { Socket } from "socket.io";
// import { orderQueue } from "./order-queue"
import { generateImageQueue } from "./generate-image-queue";

const queueListeners = (socket=null) => {

    generateImageQueue.on('global:completed', (job, result) => {
        console.log("Job Completed: ", "Result: ", result); 
        //TODO emit  to clinent
    })

    generateImageQueue.on('global:progress', (job, progress) => {
        console.log("job progress------" ,progress);

        //TODO emit progress


        //TODO emit  to clinent
    })

   

}

export default queueListeners