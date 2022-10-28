import mongoose from "mongoose";



const ImageSchema = new mongoose.Schema({
    path: {
        type: String
    },
    name: {
        type: String
    },
    title: {
        type: String
    },
    rarity: {
        type: Number
    },
    count: {
        type: Number
    },
})

const LayerSchema = new mongoose.Schema({
    name: {
        type: String
    },
    images: [ImageSchema]
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
    description: {
        type: String
    },
    defaultPrice: {
        type: Number
    },
    royaltyFee: {
        type: Number
    },
    layers: {
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
    async list() {
        const doc = await this.find()
        return doc
    },

    async findByOwnerId(ownerId) {
        const doc = await this.find({ ownerId: ownerId });
        return doc;
    },


}

export default mongoose.model('Collection', collectionSchema)
