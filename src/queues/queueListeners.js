// import { orderQueue } from "./order-queue"
import { generateImageQueue } from "./generate-image-queue";
import Collection from "../models/collection.model";

const queueListeners = (io = null) => {


    generateImageQueue.on('global:progress', async (job, progress) => {
        // console.log("Job progress------", progress);


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


    generateImageQueue.on('global:completed', async (job, result) => {
        // console.log("Job Completed: ", "Result: ", result);

        // TODO emit  to client
        const res = JSON.parse(result)
        const data = {
            message: 'Generate image completed',
            status: res.status,
            collectionId: res.id,
            ownerId: res.ownerId,
            projectDir: res.projectDir
        }


        //UPDATE collection status
        const collectionRes = await Collection.updateStatus({ "id": res.id, "status": "completed" })


        io.emit("generateCompleted", data);
    })

    generateImageQueue.on('global:failed', async (job, errorMsg) => {
        // console.log("Job failed: ", "errorMsg: ", errorMsg);

        const jobDetail = await generateImageQueue.getJob(job)
        const { id, ownerId, projectDir } = jobDetail.data

        const data = {
            message: 'Can not generate because total supply more than layer',
            status: 'Failed',
            collectionId: id,
            ownerId: ownerId,
            projectDir: projectDir,
        }

        //UPDATE collection status
        const collectionRes = await Collection.updateStatus({ "id": id, "status": "failed" })


        io.emit("generateFailed", data);
    })


    generateImageQueue.on('global:stalled', async (job) => {

        const jobDetail = await generateImageQueue.getJob(job)
        const { id, ownerId, projectDir } = jobDetail.data
      /// TODO  on stalled

       handleFaild(jobDetail)

    })



}


const  handleFaild = async (job ,io , message=null) => {
    const { id, ownerId, projectDir } = job.data

    const data = {
        messageError: 'Can not generate because total supply more than layer',
        status: 'Failed',
        collectionId: id,
        ownerId: ownerId,
        projectDir: projectDir,
    }

    const collectionRes = await Collection.updateStatus({ "id": id, "status": "failed" })
    

    io.emit("generateFailed", data);
}

export default queueListeners