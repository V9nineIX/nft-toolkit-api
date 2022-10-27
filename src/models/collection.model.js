import mongoose from "mongoose";



const ImageSchema = new mongoose.Schema({
    name:{
        type: String
    },
    path:{
        type: String
    }
})

const LayerSchema =  new mongoose.Schema({
    name: {
        type: String
    },
    image:[ImageSchema]
})


const collectionSchema = new mongoose.Schema({
    name: {
        type: String
    },
    ownerId: {
        type: String
    },
    symbol: {
        type: String
    },
    description:{
        type: String
    },
    defulatPrice:{
        type: String
    },
    royaltyFee:{
        type: String
    },
    layer:{
        type: [LayerSchema]

    }

},
{ timestamps: true }
)

collectionSchema.statics = {

 async add(body) {
        const doc = await this.create(body); /// mogia
        return doc;
 },
 async list(){
        const doc = await this.find()
        return doc
 }


}

export default mongoose.model('Collection', collectionSchema)
