import express from "express";
import mongoose from "mongoose";
import log from "./utils/logger";
import config from "../config";
import route from "./routers";
import bodyParser from "body-parser";
const path = require('path')
import cors from "cors"
import { ApolloServer, gql } from "apollo-server-express";
import { includes, isEmpty, toLower, method, mapValues, find, findIndex, orderBy, uniqBy, result, unionBy, reverse } from "lodash";
import resize from "./libs/resize"
// import { graphqlHTTP } from 'express-graphql'
// import { buildSchema } from 'graphql'
const http = require('http');
// const socketIo = require("socket.io");
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
import { generateImageQueue } from "./queues/generate-image-queue";
import queueListeners from "./queues/queueListeners";
import { API_POST_SIZE_LIMIT, COLECTION_ROOT_FOLDER, OPENSEA_NFT } from "./constants"
const fs = require('fs');
import Collection from "./models/collection.model";
import {
  updateMeta,
  deleteMeta,
  updateMetaQty,
  loadMetaJson,
  fetchMeta,
  fetchToken,
  deleteBulkMeta
} from "./libs/metaHandler"
import { createDirectory, getJsonDir, getImageDir, copyDirectory, getProjectDir, getJsonFullDir } from './utils/directoryHelper'
import httpStatus from "http-status";
import APIError from './utils/api-error'
import APIResponse from './utils/api-response'
const fse = require('fs-extra');
import { deleteFolder, fileExists } from './utils/filesHelper'
import { mergeImage } from './utils/imageHelper'
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
import fetch from 'node-fetch';



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
        getMerkleProof(contractAddress: String, phaseNumber: Int, address: String): MerkleProof
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
       


      input NftMergeParam {
        address: String
        tokenId: Int
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
         totalSupply:Int,
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
         smartContractAddress: String,
         isHasUpdate: Boolean,
         version: [Version],
         phase: [Phase],
         imageUrl: String,
         metaUrl: String,
         nftStorageType: String
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

      type BulkMeta {
        status: String,
        totalSupply: Int
    }

    type Version {
      version: Int,
      ipfsImageHash: String,
      ipfsJsonHash: String,
      buildFolder: String,
      totalSupply: Int
    }

    type Phase {
      phaseNumber: Int,
      whiteListAddress: [String]
    }

    type MerkleProof {
      root: String,
      proof: [String]
    }


      type Mutation {
          deleteMeta(id: String , edition: Int):Boolean,
          deleteBulkMeta(id:String , removeNumber:Int ,totalMint:Int , excludedNumber:Int):BulkMeta,
          updateMeta(id: String , meta:MetaParam ):Boolean,
          updateMetaQty(id:String ,metaQtyParam:[MetaQtyParam], nftType: String ):Boolean
          restoreCollection(id: String, versionNumber: Int): Boolean,
          mergeNft( mergeParam:[NftMergeParam] , address:String ,signer:String) : Boolean

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


        const { contractAddress, skip = 0, first = 10, filter = [], filterId = [] } = args
        // const { smartContractAddress  } = args

        //TODO
        const res = await Collection.findBySmartContractAddress(contractAddress);

        const { projectDir } = res[0]
        res[0].imagePath = `/folder/${projectDir}/build/image/`

        let tokens = []


        try {
          const mataData = await fetchToken({
            projectDir,
            offset: skip,
            limit: first,
            filter: filter,
            filterId: filterId,
          })
          tokens = [...mataData.meta]

        } catch (ex) {
          console.log("error", ex)
          //return res[0]
          return tokens
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

      },

      getMerkleProof: async (_, args) => {
        const { contractAddress, phaseNumber, address } = args

        const res = await Collection.findBySmartContractAddress(contractAddress);
        const { phase = [] } = res[0]

        const findPhase = phase.find((item) => item.phaseNumber == phaseNumber)
        const { whiteListAddress } = findPhase

        try {
          const leaves = whiteListAddress.map(item => keccak256(item))
          const tree = new MerkleTree(leaves, keccak256, { sort: true })

          // convert to string and start with 0x
          const buf2hex = (value) => {
            return `0x${value.toString('hex')}`
          }

          const root = buf2hex(tree.getRoot())

          let proof = []
          if (!isEmpty(address)) {
            const leaf = buf2hex(keccak256(address))
            proof = tree.getProof(leaf).map(x => buf2hex(x.data));
          }

          return { root, proof }

        } catch (ex) {
          console.log('err', ex);
        }

      },


    },
    Mutation: {
      deleteMeta: async (_, { id, edition }) => {
        let status = false

        try {
          const res = await Collection.findByCollectionId(id);
          const { projectDir } = res[0]

          const result = await deleteMeta({ projectDir, edition, res })

          await Collection.updateById(id, { "totalSupply": result?.length, "maxPublicSupply": result?.length });


          if (result) {
            status = true
          }



        } catch (ex) {
          console.log(ex)
        }

        return status


      },
      deleteBulkMeta: async (_, { id, removeNumber, totalMint, excludedNumber }) => {
        let status = false
        let totalSupplyByID = 0


        try {
          const res = await Collection.findByCollectionId(id);
          const { projectDir, name, totalSupply, ipfsImageHash, ipfsJsonHash, version } = res[0]
          totalSupplyByID = totalSupply

          const resultDeleteBlukMeta = await deleteBulkMeta({
            id,
            name,
            projectDir,
            removeNumber,
            totalMint,
            excludedNumber,
            version
          })

          const { maxSupply } = resultDeleteBlukMeta

          let versionList = [...version]
          // const sourceFolder = `./${COLECTION_ROOT_FOLDER}/${projectDir}/build`
          const destinationFolder = `./${COLECTION_ROOT_FOLDER}/${projectDir}/build-v${version.length + 1}`

          versionList.push({
            version: version.length + 1,
            ipfsImageHash: ipfsImageHash,
            ipfsJsonHash: ipfsJsonHash,
            buildFolder: destinationFolder,
            totalSupply: totalSupplyByID
          })


          const result = await Collection.updateById(id, { "totalSupply": maxSupply, "isHasUpdate": true, "version": versionList });

          if (result) {
            status = true
            totalSupplyByID = result?.totalSupply
          }

        } catch (ex) {
          console.log(ex)
        }

        return {
          status: status,
          totalSupply: totalSupplyByID
        }


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
        const { id, versionNumber } = args

        try {
          const res = await Collection.findByCollectionId(id);
          const { projectDir, version } = res[0]

          const folderVersion = version[versionNumber - 1]
          const { ipfsImageHash, ipfsJsonHash, totalSupply, buildFolder } = folderVersion

          if (fs.existsSync(buildFolder)) {
            const sourceFolder = `./${COLECTION_ROOT_FOLDER}/${projectDir}/build`
            await fse.emptyDir(sourceFolder);
            await copyDirectory(buildFolder, sourceFolder)


            let cloneVersion = [...version]
            const newVersion = cloneVersion.slice(0, versionNumber - 1) // delete version after versionNumber

            for (const item of cloneVersion) {
              if (item.version >= versionNumber) {
                await deleteFolder(item?.buildFolder)
              }
            }

            await Collection.updateById(id, { "ipfsImageHash": ipfsImageHash, "ipfsJsonHash": ipfsJsonHash, "totalSupply": totalSupply, "version": newVersion });


            return true
          }
        } catch (ex) {
          throw new Error(ex)
        }
      },
      mergeNft: async (_, args) => {
        const { mergeParam = [], address, signer } = args
        console.log(`----  mergeNft:  args:`, args);

        try {


          const frontLayerNft = mergeParam[0] //closet
          const backLayerNft = mergeParam[1] //bg

          //TODO: check  owner
          const frontLayer = await Collection.findBySmartContractAddress(frontLayerNft.address);
          const backLayer = await Collection.findBySmartContractAddress(backLayerNft.address);
          const { projectDir: frontLayerDir } = frontLayer[0]
          const { projectDir: backLayerDir } = backLayer[0]

          //Todo file image 

          console.log(`----  mergeNft:  frontLayerDir:`, frontLayerDir);
          console.log(`----  mergeNft:  backLayerDir:`, backLayerDir);
          const frontLayerLayerImageDir = getImageDir(frontLayerDir) || ''
          const backLayerLayerImageDir = getImageDir(backLayerDir) || ''

          const frontImage = `${frontLayerLayerImageDir}/${frontLayerNft.tokenId}.png`
          const backImage = `${backLayerLayerImageDir}/${backLayerNft.tokenId}.png`

          const resultImage = `${backLayerLayerImageDir}/${frontLayerNft.tokenId}-temp.png`
          const folderSizeDefualt = `${backLayerLayerImageDir}W0/`
          const smallSizeFolder = `${backLayerLayerImageDir}W200/`

          try {

            if (await fileExists(frontImage) && await fileExists(backImage)) {

              await mergeImage({
                frontImage,
                backImage,
                resultImage
              })

              // todo clear cahce

              if (fs.existsSync(folderSizeDefualt)) {
                await fse.copy(backImage, `${folderSizeDefualt}/${backLayerNft.tokenId}.png`)
              }

              await createDirectory(smallSizeFolder)

              await resize(
                backImage,
                "png",
                200,
                200,
                `${smallSizeFolder}${backLayerNft.tokenId}.png`)


              /* ------ Merge Attributes and refresh open sea ------ */
              const frontLayerJsonDir = getJsonFullDir(frontLayerDir)
              const backLayerJsonDir = getJsonFullDir(backLayerDir)

              const pathFrontJson =
                // 'folder/a3df5b9d-f74b-4732-9207-eb4074b2011f-NanNy1/build/json/0.json' //closet => frontLayerNft.tokenId
                `${frontLayerJsonDir}/${frontLayerNft.tokenId}.json`
              const pathBackJson =
                // 'folder/1916acd6-84ed-42e6-8358-62af1ae645e0-Happy-melody-v6/build/json/0.json' //bg => backLayerNft.tokenId
                // 'http://128.199.185.87:3033/folder/1916acd6-84ed-42e6-8358-62af1ae645e0-Happy-melody-v6/build/json/413.json'
                `${backLayerJsonDir}/${backLayerNft.tokenId}.json`

              const frontJson = JSON.parse(fs.readFileSync(pathFrontJson, 'utf-8'));
              const backJson = JSON.parse(fs.readFileSync(pathBackJson, 'utf-8'));
              // let newFrontJson = { ...frontJson }
              let newBackJson = { ...backJson }

              const resNewAttributes = reverse(unionBy(reverse(frontJson["attributes"]), reverse(backJson["attributes"]), 'trait_type'))
              newBackJson["attributes"] = resNewAttributes
              fs.writeFileSync(backLayerJsonDir, JSON.stringify(newBackJson, null, 2));


              const wait = (milliseconds) => {
                return new Promise((resolve) => {
                  setTimeout(() => resolve(), milliseconds);
                });
              };

              const refresh = async (address = null, tokenId = null) => {
                try {
                  // await fetch(`https://api.opensea.io/api/v1/asset/${address}/${tokenId}/?force_update=true`);
                  await fetch(`${OPENSEA_NFT}/api/v1/asset/${address}/${tokenId}/?force_update=true`);
                  console.log(`opensea refreshed ${tokenId}`);
                  await wait(100);
                } catch (err) {
                  console.warn(`Unable to refresh cache: ${tokenId}`, err);
                }
              };

              refresh(address, backLayerNft?.tokenId)
              /* ------ Merge Attributes and refresh open sea ------ */

            } else {
              throw Error("Image not found")
            }



          } catch (ex) {
            //TODO : / restore image to original 
            const rootProjectDir = getProjectDir(backLayerDir)
            const folderOriginalImage = `${rootProjectDir}/build-original/image/`
            const originalImage = `${folderOriginalImage}${backLayerNft.tokenId}.png`


            if (fs.existsSync(folderOriginalImage)) {
              await fse.copy(originalImage, backImage)
            }

            if (fs.existsSync(folderSizeDefualt)) { // unlink
              await fse.copy(originalImage, `${folderSizeDefualt}/${backLayerNft.tokenId}.png`)
            }

            if (fs.existsSync(smallSizeFolder)) { // unlink
              fse.unlink(`${smallSizeFolder}${backLayerNft.tokenId}.png`)
            }

            throw ex
          }




          return true

        } catch (ex) {
          console.log(ex)
          // TODO restore image to original
          return false

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
// require('events').EventEmitter.prototype._maxListeners = 0;
require('events').defaultMaxListeners = 0;

//   process.on('warning', function (err) {
//     if ( 'MaxListenersExceededWarning' == err.name ) {
//       console.log('o kurwa');
//       // write to log function
//       process.exit(1); // its up to you what then in my case script was hang

//     }
//   });

app.get('/progressGenerateImageSSE', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  //   const time = (new Date()).toLocaleTimeString('en-GB', { timezone: 'asia/bangkok' });

  //   res.write(`connection sever sent events ========= ${time} =========\n\n`);

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


app.get('/meta/:path/:tokenId', async (req, res) => {
  const { path, tokenId } = req.params

  try {

    const img = `folder/${path}/build/json/metadata.json`
    const basePath = process.cwd();
    const imagePath = basePath + "/" + img

    //check if a file or directory exists 
    fs.access(imagePath, fs.constants.F_OK, async (err) => {
      if (err) {
        res.status(httpStatus.NOT_FOUND).send({ message: "Meta not found" })
      } else {
        const id = tokenId.split('.json')[0]
        const result = JSON.parse(fs.readFileSync(img, 'utf-8'));
        const meta = result.find((item) => item.edition == id)

        if (!isEmpty(meta)) {
          res.status(httpStatus.OK).end(JSON.stringify(meta, null, 3))
        } else {
          res.status(httpStatus.NOT_FOUND).send({ message: "Meta not found" })
        }
      }
    })


  } catch (ex) {

    console.log("error", ex)
    res.status(httpStatus.NOT_FOUND).send({ message: "Meta not found" })

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
