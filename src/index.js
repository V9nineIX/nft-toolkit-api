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
import { updateMeta, deleteMeta } from "./libs/metaHandler"
import { getJsonDir } from './utils/directoryHelper'
import { loadMetaJson } from './libs/metaHandler'



const grapQLServer = new ApolloServer({
  playground: true,
  typeDefs: gql`
      type Query {
        hello: String,
        meta: Meta,
        nft(id: String ,offset: Int, limit: Int , filter: [FilterParam] ):NFT,
        customToken(id: String ,offset: Int, limit: Int): CustomToken
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
         layers:[Layer],
         meta:[Meta]
      }

      type CustomToken {
        totalImage:Int,
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

      type Mutation {
          deleteMeta(id: String , edition: Int):Boolean,
          updateMeta(id: String , meta:MetaParam ):Boolean
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

          const metadata = JSON.parse(fs.readFileSync(`./folder/${projectDir}/build/json/metadata.json`, 'utf-8'));
          //res[0].totalImage = metadata.length

          ///Filter
          if (!isEmpty(filter)) {

            let filterMetaData = []



            for (const [index, meta] of metadata.entries()) {
              //    if(limit && index == limit){
              //         break
              //    }

              //    if(limit && index < offset){ // skip index less then offest
              //       continue
              //    }


              let isMatch = false

              for (const filterObject of filter) {

                const filterValue = mapValues(filterObject.value, method('toLowerCase')); //value:["body magic","bacgord"]


                for (const attr of meta.attributes) {

                  if (toLower(attr.trait_type) == toLower(filterObject.key)) {
                    if (!isEmpty(filterValue)) {
                      if (includes(filterValue, toLower(attr.value))) {

                        filterMetaData.push(meta)
                        isMatch = true

                      }
                    }
                  }
                  if (isMatch) { // exit loop
                    break
                  }
                }
                if (isMatch) { // exit loop
                  break
                }

              } // end loop filter

            } // end loop

            res[0].totalImage = filterMetaData.length
            if (limit) {
              res[0].meta = [...filterMetaData].slice(offset, limit)
            } else {
              res[0].meta = [...filterMetaData]
            }


          } // end if
          else {
            res[0].totalImage = metadata.length
            if (limit) {
              res[0].meta = [...metadata].slice(offset, limit)
            } else {
              res[0].meta = [...metadata]
            }
          }

        } catch (ex) {
          console.log("error", ex)
          res[0].totalImage = 0
        }

        return res[0]
      },

      customToken: async (_, args) => {

        //get collection info
        const { id, limit = null, offset = 0 } = args

        const res = await Collection.findByCollectionId(id);

        const { projectDir } = res[0]
        const json = getJsonDir(projectDir)

        res[0].imagePath = `/folder/${projectDir}/build/image/`

        let result = {}
        try {
          // check file already exist
          if (fs.existsSync(`${json}/metadata.json`)) {
            const metadata = await loadMetaJson({ projectDir })

            if (!isEmpty(metadata)) {
              result.totalImage = metadata.length

              if (limit) {
                result.meta = [...metadata].slice(offset, limit)
              } else {
                result.meta = [...metadata]
              }

            }
          } else {
            result = []
          }


        } catch (ex) {
          console.log("error", ex)
          result = [{ totalImage: 0 }]
        }

        return result
      }
    },
    Mutation: {
      deleteMeta: async (_, { id, edition }) => {
        try {
          const res = await Collection.findByCollectionId(id);
          const { projectDir } = res[0]

          const result = await deleteMeta({ projectDir, edition })

        } catch (ex) {
          console.log(ex)

        }


      },
      updateMeta: async (_, { id, meta }) => {
        // console.log(meta)
        try {
          const res = await Collection.findByCollectionId(id);

          const { projectDir } = res[0]
          const { edition = null, attributes = [] ,customAttributes=[] } = meta

          const metadata = await updateMeta({ projectDir, edition, attributes ,customAttributes })

          return true

        } catch (ex) {
          throw new Error("Error can not update meta")
        }

      }
    }
  }
})


// Construct a schema, using GraphQL schema language
// const schema = buildSchema(`
// type Query {
//   hello: String
// }
// `);

// // The root provides a resolver function for each API endpoint
// const root = {
//     hello: () => {
//       return 'Hello world!';
//     },
// };




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
