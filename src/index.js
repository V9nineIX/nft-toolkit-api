import express from "express";
import mongoose from "mongoose";
import log from "./utils/logger";
import config from "../config";
import route from "./routers";
import bodyParser from "body-parser";
const path = require('path')
import cors from "cors"
import { ApolloServer, gql } from "apollo-server-express";
import { includes, isEmpty, toLower, method, mapValues, find, findIndex, orderBy, uniqBy } from "lodash";
import resize from "./libs/resize"
// import { graphqlHTTP } from 'express-graphql'
// import { buildSchema } from 'graphql'
const http = require('http');
const socketIo = require("socket.io");
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
import { generateImageQueue } from "./queues/generate-image-queue";
import queueListeners from "./queues/queueListeners";
import { API_POST_SIZE_LIMIT, COLECTION_ROOT_FOLDER } from "./constants"
const fs = require('fs');
import Collection from "./models/collection.model";
import { updateMeta,
         deleteMeta, 
         updateMetaQty  ,
         loadMetaJson ,
         fetchMeta  ,
         fetchToken ,
         deleteBulkMeta
        } from "./libs/metaHandler"
import { getJsonDir, copyDirectory } from './utils/directoryHelper'
import httpStatus from "http-status";
import APIError from './utils/api-error'
import APIResponse from './utils/api-response'
import { createDirectory } from './utils/directoryHelper'
const fse = require('fs-extra');




const grapQLServer = new ApolloServer({
  playground: true,
  typeDefs: gql`
      type Query {
        hello: String,
        meta: Meta,
        nft(id: String ,offset: Int, limit: Int , filter: [FilterParam], startIndex: Int):NFT,
        nftBySmartContractAddress(smartContractAddress: String ,offset: Int, limit: Int , filter: [FilterParam] ):NFT,
        #nftBySmartContractAddress(smartContractAddress: String ):NFT,
        customToken(id: String ,offset: Int, limit: Int): CustomToken,
        metas(contractAddress: String): [LayerFilter],
        tokens(contractAddress: String  , first:Int , skip:Int, filter: [FilterParam] ,  filterId:[Int]  ):[Token],
        totalTokens(contractAddress: String):Int,
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
          deleteBulkMeta(id:String , removeNumber:Int ,totalMint:Int , excludedNumber:Int):Boolean,
          updateMeta(id: String , meta:MetaParam ):Boolean,
          updateMetaQty(id:String ,metaQtyParam:[MetaQtyParam], nftType: String ):Boolean
          restoreCollection(id: String): Boolean
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
        const { id, limit = null, offset = 0, filter = [], startIndex = 0 } = args
        const res = await Collection.findByCollectionId(id);


        const { projectDir } = res[0]
        res[0].imagePath = `/folder/${projectDir}/build/image/`
        //TODO: get meta from json file

        try {
          const mataData = await fetchMeta({
            projectDir,
            offset,
            limit,
            filter,
            startIndex
          })

          res[0].totalImage = mataData.totalImage
          res[0].meta = mataData.meta

        } catch (ex) {
          console.log("error", ex)
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
            limit,
            filter
          })

          res[0].totalImage = mataData.totalImage
          res[0].meta = mataData.meta

        } catch (ex) {
          console.log("error", ex)
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
        const { projectDir } = res[0]

        let result = []
        let custom_token = []
        try {
          const metaData = await loadMetaJson({ projectDir })
          const customToken = metaData.filter((item) => item.tokenType == "custom")

          if (!isEmpty(customToken)) {
            for (const customValue of customToken) {

              // custom token add arrtibute
              if (!isEmpty(customValue.attributes)) {
                for (const attrValue of customValue.attributes) {
                  if (attrValue.value && attrValue.trait_type) {
                    const resStructure = {
                      id: `${attrValue?.trait_type}.${attrValue?.value.replaceAll(' ', '_')}`,
                      traitType: attrValue?.trait_type,
                      value: attrValue?.value,
                      useCount: 0,
                    }
                    custom_token.push(resStructure)
                  }
                }
              }


              // custom token add custom attributes
              if (!isEmpty(customValue.customAttributes)) {
                for (const customAttr of customValue.customAttributes) {
                  if (customAttr.value && customAttr.trait_type) {
                    const resStructure = {
                      id: `${customAttr?.trait_type}.${customAttr?.value.replaceAll(' ', '_')}`,
                      traitType: customAttr?.trait_type,
                      value: customAttr?.value,
                      useCount: 0,
                    }
                    custom_token.push(resStructure)
                  }
                }
              }
            }
          }


          const traitList = orderBy(res[0]?.layers, ["name"], ['desc'])

          if (traitList && traitList.length) {
            for (const element of traitList) {

              for (const elementImage of element?.images) {
                const resStructure = {
                  id: `${element?.name}.${elementImage?.name.replaceAll(' ', '_')}`,
                  traitType: element?.name,
                  value: elementImage?.name,
                  useCount: 0,
                }
                result.unshift(resStructure)
              }
            }
          }
        } catch (error) {
          console.log('error', error)
        }

        if (!isEmpty(custom_token)) {
          const mergeArr = [...result, ...custom_token]
          result = uniqBy(mergeArr, 'id')
        }


        return result
      },
      tokens: async (_, args) => {


         const { contractAddress, skip = 0, first = 10 , filter=[] ,filterId=[] } = args
        // const { smartContractAddress  } = args

        //TODO
        const res = await Collection.findBySmartContractAddress(contractAddress);

        const { projectDir } = res[0]
        res[0].imagePath = `/folder/${projectDir}/build/image/`

        let tokens = []


        try {
            const mataData = await fetchToken({
                projectDir,
                offset:skip,
                limit:first,
                filter:filter ,
                filterId:filterId,
            })
            tokens = [...mataData.meta]

        }catch(ex){
            console.log("error",ex)
            //return res[0]
            return  tokens 
        }
        return tokens


      }, //  end tokens
      totalTokens: async (_, args) => {
        const { contractAddress } = args

        const res = await Collection.findBySmartContractAddress(contractAddress);
        const { projectDir } = res[0]
        let countMeta = 0

        //TODO 
        try {
          const metaData = await loadMetaJson({ projectDir })
          countMeta = metaData.length

        } catch (ex) {
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
      deleteBulkMeta: async (_, { id, removeNumber ,totalMint , excludedNumber }) => {
        let status = false

        try {
          const res = await Collection.findByCollectionId(id);
          const { projectDir ,name } = res[0]

          console.log(res)

          const resultDeleteBlukMeta = await  deleteBulkMeta({
             id,
             name,
             projectDir, 
             removeNumber,
             totalMint,
             excludedNumber
             })

          const { maxSupply } = resultDeleteBlukMeta 

          const result = await Collection.updateById(id, { "totalSupply":  maxSupply , "isHasUpdate": true});


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
      },
      
      restoreCollection: async (_, args) => {
        const { id } = args

        try {
          const res = await Collection.findByCollectionId(id); // find by collection id
          const { projectDir } = res[0]

          if(fs.existsSync(`./folder/${projectDir}/build-v1`)) {
            const sourceFolder = `./${COLECTION_ROOT_FOLDER}/${projectDir}/build`
            const destinationFolder = `./${COLECTION_ROOT_FOLDER}/${projectDir}/build-v1`

            await fse.emptyDir(sourceFolder);
            await copyDirectory(destinationFolder, sourceFolder)
            return true
          }
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



/* Sever sent events */

app.setMaxListeners(0);
app.get('/progressGenerateImageSSE', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const time = (new Date()).toLocaleTimeString('en-GB', { timezone: 'asia/bangkok' });

  res.write(`connection sever sent events ========= ${time} =========\n\n`);

  queueListeners(null, res)

});
/* Sever sent events */



app.get('/image/:path/:tokenId', async (req, res) => {

  // Extract the query-parameter
  const widthString = req.query.w
  const heightString = req.query.h
  const format = req.query.format
  const { path, tokenId } = req.params

  try {

    const img = `folder/${path}/build/image/${tokenId}.png`
    const smallSizeFolder = `folder/${path}/build/imageW${widthString || "0"}/`
    const returnImage = `${smallSizeFolder}${tokenId}.png`

    const basePath = process.cwd();


    await createDirectory(smallSizeFolder)

    // Parse to integer if possible
    let width, height
    if (widthString) {
      width = parseInt(widthString)
    }
    if (heightString) {
      height = parseInt(heightString)
    }




    const imagePath = basePath + "/" + img

    fs.access(imagePath, fs.constants.F_OK, async (err) => {
      if (err) {
        res.status(httpStatus.NOT_FOUND).send({ message: "Image not found" })
      } else {

        //todo  smallSize 
        const stream = await resize(imagePath, format, width, height, `${smallSizeFolder}${tokenId}.png`)

        return stream.pipe(res)
      }
    })








    // }) //  end  read file


  } catch (ex) {

    console.log("error", ex)
    res.status(httpStatus.NOT_FOUND).send({ message: "Image not found" })

  }
})






const httpServer = http.createServer(app);
// const io = socketIo(httpServer, { cors: { origin: "*" } });

// app.use((req, res, next) => {
//   req.io = io;
//   return next();
// });


// io.on('connection', (socket) => {
//   // const { ownerId = null } = socket.handshake.query
//   // console.log('user connected', socket.handshake.query.ownerId);

//   // socket.on('disconnect', function () {
//   //   console.log('user disconnected');
//   // });

//   // console.log('====================================');
//   // console.log('connection server socket');
//   // console.log('====================================');

// })


// io.use((socket, next) => {
//   // if (!isEmpty(socket.handshake.query.ownerId)) {
//   //   next();
//   // } else {
//   //   next(new Error("invalid"));
//   // }

//   next();

// });


//  queueListeners(null,null)

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
