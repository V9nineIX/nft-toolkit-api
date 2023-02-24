// import { orderQueue } from "./order-queue"
import { generateImageQueue } from "./generate-image-queue";
import Collection from "../models/collection.model";
import { countFilesInDir, renameFile } from '../utils/filesHelper'



const queueListeners = (io = null, resSSE = null) => {




    generateImageQueue.on('global:progress', async (job, progress) => {
        try {
            console.log("Job progress------", progress);


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

            if (io) {
                io.emit("generateProgress", data);
            }

            if (resSSE) {
                const resData = `data: ${JSON.stringify(data)}\n\n`;
                resSSE.write(resData);
                //resSSE.end();
            }
        } catch (error) {
            console.log(`error:`, error);
        }
    })


    generateImageQueue.on('global:completed', async (job, result) => {
        try {
            console.log("Job Completed: ", "Result: ", result);

            // TODO emit  to client
            const res = JSON.parse(result)

            const data = {
                message: 'Generate image completed',
                status: res.status,
                collectionId: res.id,
                ownerId: res.ownerId,
                projectDir: res.projectDir
            }

            //TODO: update image max supply


            const imageDir = res.projectDir + "/build/image"
            const maxSupply = await countFilesInDir(imageDir)
            const collectionRes = Collection.updateById(res.id, { "status": "completed", "totalSupply": maxSupply })

            if (io) {
                io.emit("generateCompleted", data);
            }

            if (resSSE) {
                const resData = `data: ${JSON.stringify(data)}\n\n`;
                resSSE.write(resData);
                resSSE.end();
            }
        } catch (error) {
            console.log(`error:`, error);
        }
    })

    generateImageQueue.on('global:failed', async (job, errorMsg) => {
        try {
            console.log("Job failed: ", "errorMsg: ", errorMsg);

            const jobDetail = await generateImageQueue.getJob(job)
            handleFailed(jobDetail, io, null, resSSE)
        } catch (error) {
            console.log(`error:`, error);
        }
    })


    generateImageQueue.on('global:stalled', async (job) => {
        try {
            //CPU stalled
            console.log("Job stalled");
            const jobDetail = await generateImageQueue.getJob(job)

            /// TODO  on stalled
            handleFailed(jobDetail, io, null, resSSE)
        } catch (error) {
            console.log(`error:`, error);
        }
    })



}


const handleFailed = async (job, io, message = null, resSSE = null) => {
    const { id, ownerId, projectDir } = job.data

    const data = {
        message: 'Can not generate please try agian',
        status: 'Failed',
        collectionId: id,
        ownerId: ownerId,
        projectDir: projectDir,
    }

    const collectionRes = await Collection.updateStatus({ "id": id, "status": "failed" })

    if (io) {
        io.emit("generateFailed", data);
    }

    if (resSSE) {
        const resData = `data: ${JSON.stringify(data)}\n\n`;
        resSSE.write(resData);
        //resSSE.end();
    }
}

export default queueListeners