import mongoose from "mongoose";


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
    }

})

collectionSchema.statics = {
 async add(body) {
        const doc = await this.create(body);
        return doc;
 },


}

export default mongoose.model('Collection', collectionSchema)
