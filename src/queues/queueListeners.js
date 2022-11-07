// import { orderQueue } from "./order-queue"
import { generateImageQueue } from "./generate-image-queue";

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
        io.emit("generateProgress", data);
    })


    generateImageQueue.on('global:completed', (job, result) => {
        // console.log("Job Completed: ", "Result: ", result);


        //TODO emit  to client
        const res = JSON.parse(result).result
        const data = {
            status: res.status,
            collectionId: res.id,
            ownerId: res.ownerId,
            projectDir: res.projectDir
        }
        io.emit("generateCompleted", data);


    })






}

export default queueListeners