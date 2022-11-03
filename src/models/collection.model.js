import mongoose from "mongoose";



const ImageSchema = new mongoose.Schema({
    path: {
        type: String,
        default: "",
    },
    name: {
        type: String,
        default: "",
    },
    title: {
        type: String,
        default: "",
    },
    rarity: {
        type: Number,
        default: 0,
    },
    count: {
        type: Number,
        default: 0,
    }
})

const LayerSchema = new mongoose.Schema({
    name: {
        type: String,
        default: "",
    },
    images: [ImageSchema]
})


const collectionSchema = new mongoose.Schema({
    name: {
        type: String,
        default: "",
    },
    ownerId: {
        type: String,
        default: "",
    },
    symbol: {
        type: String,
        default: "",
    },
    description: {
        type: String,
        default: "",
    },
    coverImage: {
        type: String,
        default: "",
    },
    defaultPrice: {
        type: Number,
        default: 0,
    },
    royaltyFee: {
        type: Number,
        default: 0,
    },
    totalSupply: {
        type: Number,
        default: 10,
    },
    projectDir: {
        type: String,
        default: "",
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

    async findByCollectionId(id) {
        const doc = await this.find({ _id: id });
        return doc;
    },

    async updateById(id, body) {
        const doc = await this.findByIdAndUpdate(id, body, { new: true });
        return doc;
    },

    async removeLayerById(id) {
        /* Remove Collection */
        // await this.deleteOne({ _id: "63624b9bfd8eb3f178d57f0f" }).then(result => {
        //     console.log('result', result)
        // });
        const doc = await this.update(
            { $pull: { layers: { '_id': id } } }
        );
        return doc;
    },


}

export default mongoose.model('Collection', collectionSchema)
