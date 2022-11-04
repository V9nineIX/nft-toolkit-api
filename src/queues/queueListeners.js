import { orderQueue } from "./order-queue"

const queueListeners = () => {

    orderQueue.on('completed', (job, result) => {
        console.log("Job Completed: ", "Result: ", result); 
        //TODO emit  to clinent
    })
}

export default queueListeners