import mongoose from "mongoose";



const ImageSchema = new mongoose.Schema({
    name: {
        type: String
    },
    path: {
        type: String
    },
    rarity: {
        type: String
    },
    count : {
        type: Number
    }
})

const LayerSchema = new mongoose.Schema({
    name: {
        type: String
    },
    image: [ImageSchema]
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
        type: String
    },
    royaltyFee: {
        type: String
    },
    totalSupply: {
        type: Number
    },
    layer: {
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

    async findByCollectionId(id) {
        const doc = await this.find({ _id: id });
        return doc;
    },


}

export default mongoose.model('Collection', collectionSchema)
