import mongoose from "mongoose";


const collectionSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    symbol: {
        required: true,
        type: String
    },
    description:{
        required: false,
        type: String
    },
    defulatPrice:{
        required: true,
        type: String
    },
    royaltyFee:{
        required: false,
        type: String
    }

})

collectionSchema.statics = {
 async add(body) {
        const doc = await this.create(body);
        return doc;
 },


}

export default mongoose.model('Collection', collectionSchema)
