// import { orderQueue } from "./order-queue"
import { generateImageQueue } from "./generate-image-queue";
import Collection from "../models/collection.model";

const queueListeners = (io = null) => {


    generateImageQueue.on('global:progress', async (job, progress) => {
        // console.log("job progress------", progress);


        const jobDetail = await generateImageQueue.getJob(job)
        const { id, ownerId, projectDir } = jobDetail.data

        //TODO emit progress
        const data = {
            progress: progress,
            status: 'Progressing',
            collectionId: id,
            ownerId: ownerId,
            projectDir: projectDir
        }
         
        //TODO update status


        io.emit("generateProgress", data);
    })


    generateImageQueue.on('global:completed',async (job, result) => {
         console.log("Job Completed: ", "Result: ", result);


       // TODO emit  to client
        const res = JSON.parse(result)
        const data = {
            status: res.status,
            collectionId: res.id,
            ownerId: res.ownerId,
            projectDir: res.projectDir
        }

    
        //UPDATE collection status
        const colletionRes = await Collection.updateStatus({"id":res.id, "status":"completed"})
    
        

        io.emit("generateCompleted", data);


    })






}

export default queueListeners