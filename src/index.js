import express from "express";
import mongoose from "mongoose";
import log from "./utils/logger";
import config from "../config";
import route from "./routers";
import bodyParser from "body-parser";
const path = require('path')
import cors from "cors"
import { ApolloServer, gql } from "apollo-server-express";
import { includes, isEmpty, toLower, method, mapValues, find, findIndex } from "lodash";

// import { graphqlHTTP } from 'express-graphql'
// import { buildSchema } from 'graphql'
const http = require('http');
const socketIo = require("socket.io");
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
import { generateImageQueue } from "./queues/generate-image-queue";
import queueListeners from "./queues/queueListeners";
import { API_POST_SIZE_LIMIT } from "./constants"
const fs = require('fs');
import Collection from "./models/collection.model";
import { updateMeta, deleteMeta, updateMetaQty } from "./libs/metaHandler"
import { getJsonDir } from './utils/directoryHelper'
import { loadMetaJson , fetchMeta  ,fetchToken } from './libs/metaHandler'



const grapQLServer = new ApolloServer({
  playground: true,
  typeDefs: gql`
      type Query {
        hello: String,
        meta: Meta,
        nft(id: String ,offset: Int, limit: Int , filter: [FilterParam] ):NFT,
        nftBySmartContractAddress(smartContractAddress: String ,offset: Int, limit: Int , filter: [FilterParam] ):NFT,
        #nftBySmartContractAddress(smartContractAddress: String ):NFT,
        customToken(id: String ,offset: Int, limit: Int): CustomToken,
        metas(contractAddress: String): [LayerFilter],
        tokens(contractAddress: String  , first:Int , skip:Int, filter: [FilterParam]  ):[Token],
        totalTokens(contractAddress: String):Int
      }

      type Attributes {
        trait_type: String,
        value: String
      }

      input FilterParam {
        key: String,
        value:[String]
      }


      input MetaParam {
        edition: Int,
        attributes:[AttributesParam],
        customAttributes:[AttributesParam]
      }

      input MetaQtyParam {
        edition: Int,
        qty: Int
      }


 

      input AttributesParam {
        trait_type: String,
        value: String
      }

      type Meta {
         name: String,
         description: String,
         image: String,
         edition:String,
         date: String,
         attributes:[Attributes],
         rawImage:String,
         dna:String,
         tokenType:String,
         customAttributes:[Attributes],
         qty: Int,
         type: String,
      }

      type NFT {
         _id: String,
         name: String,
         ownerId:String,
         status:String,
         symbol:String,
         description:String,
         totalSupply:String,
         projectDir:String,
         royaltyFee:Float,
         defaultPrice:Float,
         imagePath:String,
         totalImage:Int,
         nftType:String,
         layers:[Layer],
         meta:[Meta],
         ipfsJsonHash:String,
         ipfsImageHash:String,
         maxPublicSupply:Int,
         maxTokensPerAddress:Int,
         smartContractAddress: String
      }

      type CustomToken {
        totalImage:Int,
        totalAllImage:Int,
        meta:[Meta]
      }


      type Layer {
        name: String,
        _id: String,
        images:[Image]
      }

      type Image {
         path:String,
         name:String,
         title:String,
         rarity:String
         count:String
      }


      type Token  {
            id: Int,
            tokenID: Int
            tokenURI: String
            ipfsURI: String
            image: String
            name: String
            description: String
            updatedAtTimestamp: Int!
            owner: User!
            metas: [Triat]
      }

      type User {
        id: String,
        tokens: [Token!]
      }

      type Triat {
          id:String,
          traitType: String,
          value: String
      }



      type Mutation {
          deleteMeta(id: String , edition: Int):Boolean,
          updateMeta(id: String , meta:MetaParam ):Boolean,
          updateMetaQty(id:String ,metaQtyParam:[MetaQtyParam], nftType: String ):Boolean
      }

      type LayerFilter {
        id: String,
        traitType: String,
        value: String,
        useCount: Int,
      }

    `,
  resolvers: {
    Query: {
      hello: () => 'Hello world!',
      meta: () => {
        const data = JSON.parse(fs.readFileSync('./build/json/1.json', 'utf-8'));
        return data
      },
      nft: async (_, args) => {

        //get collection info
        const { id, limit = null, offset = 0, filter = [] } = args
        const res = await Collection.findByCollectionId(id);


        const { projectDir } = res[0]
        res[0].imagePath = `/folder/${projectDir}/build/image/`
        //TODO: get meta from json file

        try {
            const mataData = await fetchMeta({
                projectDir,
                offset,
                limit,
                filter
            })

            res[0].totalImage   =  mataData.totalImage 
            res[0].meta         =  mataData.meta

        }catch(ex){
            console.log("error",ex)
            return res[0]
        }
        return res[0]
      },

      nftBySmartContractAddress: async (_, args) => {

        const { smartContractAddress, limit = null, offset = 0, filter = [] } = args
        const res = await Collection.findBySmartContractAddress(smartContractAddress);

        const { projectDir } = res[0]
        res[0].imagePath = `/folder/${projectDir}/build/image/`
        //TODO: get meta from json file
        try {
            const mataData = await fetchMeta({
                projectDir,
                offset,
                limit
            })

            res[0].totalImage   =  mataData.totalImage 
            res[0].meta         =  mataData.meta

        }catch(ex){
            console.log("error",ex)
            return res[0]
        }
        return res[0]
      },

      customToken: async (_, args) => {

        //get collection info
        const { id, limit = null, offset = 0 } = args

        const res = await Collection.findByCollectionId(id);

        const { projectDir } = res[0]
        const json = getJsonDir(projectDir)

        let result = {}
        try {
          // check file already exist
          if (fs.existsSync(`${json}/metadata.json`)) {
            const metadata = await loadMetaJson({ projectDir })


            if (!isEmpty(metadata)) {

              let filterMeta = metadata.filter(item => item.tokenType == "custom")
              result.totalImage = filterMeta.length
              result.totalAllImage = metadata.length

              if (limit) {
                result.meta = [...filterMeta].slice(offset, limit)
              } else {
                result.meta = [...filterMeta]
              }

            }
          } else {
            result = {}
          }


        } catch (ex) {
          console.log("error", ex)
          result.totalImage = 0
        }

        return result
      },
      metas: async (_, args) => {
        const { contractAddress } = args
        const res = await Collection.findBySmartContractAddress(contractAddress);
       

        const result = []
        try {
          if (res[0]?.layers) {
            for (const element of res[0]?.layers) {

              for (const elementImage of element?.images) {
                const resStructure = {
                  id: `${element?.name}.${elementImage?.name.replaceAll(' ', '_')}`,
                  traitType: element?.name,
                  value: elementImage?.name,
                  useCount: 0,
                }
                result.push(resStructure)
              }
            }
          }
        } catch (error) {
          console.log('error', error)
        }

        return result
      },
      tokens: async(_, args) => {


         const { contractAddress, skip = null, first = 0 , filter=[] } = args
        // const { smartContractAddress  } = args

        //TODO
        const res = await Collection.findBySmartContractAddress(contractAddress);

        const { projectDir } = res[0]
        res[0].imagePath = `/folder/${projectDir}/build/image/`
        
        let  tokens = []
        

        try {
            const mataData = await fetchToken({
                projectDir,
                offset:first,
                limit:skip ,
                filter:filter 
                 
            })
            tokens = [...mataData.meta]

        }catch(ex){
            console.log("error",ex)
            //return res[0]
            return  tokens 
        }
        return  tokens 


      }, //  end tokens
      totalTokens : async(_, args) => {
        const { contractAddress } = args

        const res = await Collection.findBySmartContractAddress(contractAddress);
        const { projectDir } = res[0]
        let  countMeta = 0

        //TODO 
        try{
           const metaData  =  await loadMetaJson({ projectDir})
           countMeta = metaData.length

        }catch(ex){
            return countMeta
        }
        return countMeta

      }

    },
    Mutation: {
      deleteMeta: async (_, { id, edition }) => {
        let status = false

        try {
          const res = await Collection.findByCollectionId(id);
          const { projectDir } = res[0]

          const result = await deleteMeta({ projectDir, edition })


          if (result) {
            status = true
          }

        } catch (ex) {
          console.log(ex)
        }

        return status


      },
      updateMeta: async (_, { id, meta }) => {
        // console.log(meta)
        try {
          const res = await Collection.findByCollectionId(id);

          const { projectDir } = res[0]
          const { edition = null, attributes = [], customAttributes = [] } = meta

          const metadata = await updateMeta({ projectDir, edition, attributes, customAttributes })

          return true

        } catch (ex) {
          throw new Error("Error can not update meta")
        }

      },
      updateMetaQty: async (_, { id, metaQtyParam, nftType }) => {
        //TODO update meta qty
        try {
          const res = await Collection.findByCollectionId(id)
          const { projectDir } = res[0]

          let updateStatus = false

          if (nftType == 'ERC1155') {
            updateStatus = await updateMetaQty({ projectDir, metaParam: metaQtyParam })
          }

          const result = await Collection.updateById(id, { "nftType": nftType });

          return updateStatus

        } catch (ex) {
          throw new Error(ex)
        }
      }
    },
  }
})





const { server, database } = config;
mongoose.connect(database.uri, database.options);

const app = express();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/bull');

createBullBoard({
  queues: [new BullAdapter(generateImageQueue)],
  serverAdapter,
});



// app.use('/graphql', graphqlHTTP({
//     schema: schema,
//     rootValue: root,
//     graphiql: true,
//   }));


grapQLServer.applyMiddleware({ app });
app.use(cors())
app.use(express.json({ limit: API_POST_SIZE_LIMIT, extended: true }))
app.use(express.urlencoded({ limit: API_POST_SIZE_LIMIT, extended: true, parameterLimit: 50000 }))
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/folder', express.static('folder'));

app.use("/bull", serverAdapter.getRouter())



const httpServer = http.createServer(app);
const io = socketIo(httpServer, { cors: { origin: "*" } });

app.use((req, res, next) => {
  req.io = io;
  return next();
});


io.on('connection', (socket) => {
  // const { ownerId = null } = socket.handshake.query
  // console.log('user connected', socket.handshake.query.ownerId);

  // socket.on('disconnect', function () {
  //   console.log('user disconnected');
  // });


  console.log('====================================');
  console.log('connection server');
  console.log('====================================');


})


io.use((socket, next) => {
  // if (!isEmpty(socket.handshake.query.ownerId)) {
  //   next();
  // } else {
  //   next(new Error("invalid"));
  // }

  next();

});


queueListeners(io)

// queuelistener()
//  
// orderQueue.on('completed', (job, result) => {
//     console.log("Job Completed: ", "Result: ", result); 
//     //TODO emit  to clinent
// })

log(app);
route(app);




httpServer.listen(server.port, server.host, () =>
  console.log(`Server has started on ${server.host}:${server.port} ${grapQLServer.graphqlPath}`)
);





export default app;
