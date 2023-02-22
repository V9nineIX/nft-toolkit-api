// import { orderQueue } from "./order-queue"
import { generateImageQueue } from "./generate-image-queue";
import Collection from "../models/collection.model";
import { countFilesInDir, renameFile } from '../utils/filesHelper'

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
   
        if(io){
          io.emit("generateProgress", data);
        }
    })


    generateImageQueue.on('global:completed', async (job, result) => {
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


        const imageDir =  res.projectDir+"/build/image"
        const maxSupply = await countFilesInDir(imageDir)
         const collectionRes =  Collection.updateById(res.id ,{"status": "completed" ,"totalSupply":maxSupply })

        if(io) {
         io.emit("generateCompleted", data);
        }
    })

    generateImageQueue.on('global:failed', async (job, errorMsg) => {
         console.log("Job failed: ", "errorMsg: ", errorMsg);

        const jobDetail = await generateImageQueue.getJob(job)
        handleFaild(jobDetail,io)
    })


    generateImageQueue.on('global:stalled', async (job) => {
         //CPU stalled
         console.log("Job stalled");
        const jobDetail = await generateImageQueue.getJob(job)
        console.log("jobDetail" , jobDetail)
      /// TODO  on stalled
       handleFaild(jobDetail,io)

    })



}


const  handleFaild = async (job ,io , message=null) => {
    const { id, ownerId, projectDir } = job.data

    const data = {
        message: 'Can not generate please try agian',
        status: 'Failed',
        collectionId: id,
        ownerId: ownerId,
        projectDir: projectDir,
    }

    const collectionRes = await Collection.updateStatus({ "id": id, "status": "failed" })
    
    if(io){
     io.emit("generateFailed", data);
    }
}

export default queueListeners