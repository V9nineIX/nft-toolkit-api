import httpStatus from "http-status";
import Collection from "../models/collection.model";
import APIResponse from "../utils/api-response";
import APIError from "../utils/api-error";
import fsx from 'fs-extra';
import fs from 'fs';
import { startCreating, writeMetaData } from '../libs/genarate'
import { last, map } from "lodash";
import { addGenerateImageQueue } from "../queues/generate-image-queue";
import { GENERATE_COLLECTION, GENERATE_IMAGE } from "../constants";
import { uploadToPinata } from '../ipfs/pinata'
import { countFilesInDir, renameFile } from '../utils/filesHelper'
import { createDirectory } from '../utils/directoryHelper'
import { uploadToNftStorage } from '../ipfs/nftStorage'
import { writeMetaForCustomServer } from '../libs/metaHandler'


const controller = {

  get: async () => {



    const layerConfigurations = [
      {
        growEditionSizeTo: 10,
        layersOrder: [
          {
            name: "Background",
            image: [{
              name: "black",
              rarity: 100
            }]
          },
          {
            name: "Eyeball",
            image: [
              {
                name: "Red",
                title: "Red",
                rarity: 100
              },
              {
                name: "White",
                title: "White",
                rarity: 1
              }
            ],
          },
          {
            name: "Eyecolor",
            image: [
              {
                name: "Cyan",
                title: "Cyan",
                rarity: 1
              },
              {
                name: "Green",
                title: "Green",
                rarity: 50
              },
              {
                name: "Pink",
                title: "Pink",
                rarity: 1
              },
              {
                name: "Purple",
                title: "Purple",
                rarity: 1
              },
              {
                name: "Red",
                title: "Red",
                rarity: 50
              },
              {
                name: "Yellow",
                title: "Yellow",
                rarity: 1
              }
            ],
          },
          { name: "Iris", image: [] },
          { name: "Shine", image: [] },
          { name: "Bottom lid", image: [] },
          { name: "Top lid", image: [] },
        ],
      }
    ];


    //  await createNewOrder({ orderNo: "333" , name:"ps5"})
    await addGenerateImageQueue({ layerConfigurations })


    // const res = await startCreating({ layerConfigurations })
    // console.log("res", res)

    //const col = await Collection.add({ "name":"peter" ,"age":20 })
    return new APIResponse(200, "Hello Collection API ....");
    // throw new APIError({
    //   status: httpStatus.NOT_FOUND,
    //   message: "user not found",
    // });
  },

  create: async ({ body }) => {

    try {
      //TODO :  create folder
      const projectName = body.name;
      const ownerId = body.ownerId
      const projectDir = ownerId + '-' + projectName
      const createDir = './folder/' + projectDir;

      let res = { ...body, projectDir: projectDir }
      const colResult = await Collection.add(res);

      fsx.ensureDir(createDir);

      if (colResult) {
        return new APIResponse(201, {
          projectDir,
          projectName
        });
      }
    } catch (ex) {

      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot create Collection",
      });
    }
  },

  uploadMultiple: async (req) => {
    // console.log("body" , body)
    //console.log("req", req.body.layer)
    //console.log(JSON.stringify(req.files))

    try {
      const layerName = req.body.layer;
      const projectDir = req.body.projectDir;
      const collectionId = req.body.collectionId;
      const createDir = './folder/' + projectDir + "/" + layerName;


      fsx.ensureDir(createDir);
      let pathLayer = []
      for (let i = 0; i < req.files.length; i++) {
        const fileName = req.files[i].filename;
        pathLayer.unshift(
          {
            path: `${createDir.replace('.', '')}/${fileName}`,
            name: fileName.replace('.png', ''),
            title: fileName.replace('.png', ''),
          }
        )
        fsx.move('./folder/' + fileName, createDir + '/' + fileName, function (err) {
          if (err) {
            console.error(err);
          } else {
            console.log("move file finish")
          }
        });

      }
      const resCollection = await Collection.findById(collectionId)
      resCollection.layers.unshift({
        name: layerName,
        images: pathLayer,
      })
      resCollection.save()

      return new APIResponse(200, { layers: [resCollection.layers[0]] });

    } catch (ex) {
      console.log("ex", ex)

      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "upload faild",
      });
    }


  }, //  end upload function



  findByOwnerId: async ({ params }) => {
    const { id } = params;
    try {
      const collection = await Collection.findByOwnerId(id);
      return new APIResponse(201, collection);
    } catch (ex) {
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot find collection by ownerId",
      });
    }
  },

  findByCollectionId: async ({ params }) => {
    const { id } = params;
    try {
      const res = await Collection.findByCollectionId(id);
      return new APIResponse(201, res);
    } catch (ex) {
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot find collection by id",
      });
    }
  },

  findBySmartContractAddress: async ({ params }) => {
    const { smartContractAddress } = params;
    try {
      const res = await Collection.findBySmartContractAddress(smartContractAddress);
      return new APIResponse(201, res);
    } catch (ex) {
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot find collection by id",
      });
    }
  },


  generateImage: async ({ body, params }) => {

    try {


      const { id } = params
      let paramCollection = { ...body.collection }
      paramCollection.status = "process"
      const res = await Collection.updateById(id, paramCollection)

      const layerConfigurations = [
        {
          growEditionSizeTo: res?.totalSupply,
          layersOrder: res?.layers
        }
      ]
      const ownerId = res?.ownerId
      const projectDir = `./folder/` + body?.projectDir

      //   const buildFolder = `${projectDir}/build/image`
      //   const jsonFolder = `${projectDir}/build/json`
      //   await fsx.ensureDir(buildFolder);
      //   await fsx.ensureDir(jsonFolder);


      const param = {
        layerConfigurations,
        projectDir,
        id,
        ownerId,
        jobType: GENERATE_IMAGE
      }

      //ADD Queue
      await addGenerateImageQueue(param)

      //   const result = await startCreating({
      //     layerConfigurations,
      //     projectDir,
      //     buildFolder,
      //     jsonFolder
      //   })
      //   console.log("result", result)

      return new APIResponse(201, res);
    } catch (ex) {
      console.log(ex)
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot genarate image",
      });

    }

  },

  updateCollectionById: async ({ body, params }) => {

    try {
      const { id } = params
      let paramCollection = { ...body }
      // paramCollection.status = "active"
      const res = await Collection.updateById(id, paramCollection)

      return new APIResponse(201, res);
    } catch (ex) {
      console.log(ex)
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot update collection",
      });
    }
  },

  removeLayerById: async ({ body, params }) => {

    try {
      const { id } = params
      const { projectDir, nameLayer } = body
      const res = await Collection.removeLayerById(id)
      if (res) {
        const nameDir = './folder/' + projectDir + "/" + nameLayer;
        fsx.removeSync(nameDir)
      }
      return new APIResponse(201, { message: "Remove layer success" });
    } catch (ex) {
      console.log(ex)
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot remove layer",
      });
    }
  },

  generateCollection: async ({ body, params }) => {
    try {


      const { id } = params
      const { layersElement, ownerId = null, projectDir: dir, totalSupply, collection } = body
      const projectDir = `./folder/` + dir
      const projectName = dir



      let paramCollection = { ...collection }
      paramCollection.status = "process"
      const res = await Collection.updateById(id, paramCollection)

      const param = {
        layersElement,
        totalSupply,
        projectDir,
        id,
        ownerId,
        projectName,
        jobType: GENERATE_COLLECTION
      }


      //TODO update database


      //  ADD Queue
      await addGenerateImageQueue(param)


      return new APIResponse(201, "OK");
    } catch (ex) {
      console.log(ex)
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot genarate image",
      });

    }

  },

  uploadIPFS: async ({ body, params }) => {
    try {
      //TODO: upload collection to IPFS
      const { id } = params
      const { jwtToken = null, provider = "nftstorage" } = body


      const collectionResult = await Collection.findByCollectionId(id)


      const { projectDir, name ,symbol ,description } = collectionResult[0]
      const imageFolder = `./folder/` + projectDir + '/build/image/'
      const jsonFolder = `./folder/` + projectDir + '/build/json/'
      let uploadResult = null

      if (provider == "pinata") {
        uploadResult = await uploadToPinata({
          collectionId: id,
          buildFolder: imageFolder,
          projectName: name,
          projectDir: projectDir,
          jsonFolder: jsonFolder,
          JWTKey: jwtToken
        })
      }
      else if(provider=="custom"){
          // TODO :  upload custom server
          uploadResult = await writeMetaForCustomServer(
            {
            projectDir :  projectDir,
            collectionInfo : collectionResult[0]
            }
        )

      } else {
        // nft  storage

        uploadResult = await uploadToNftStorage({
          collectionId: id,
          buildFolder: imageFolder,
          projectName: name,
          projectDir: projectDir,
          jsonFolder: jsonFolder,
        })
  
      }

      // todocheick

      const { ipfsImageHash = "", ipfsJsonHash = "", imageUrl = "", metaUrl = "" } = uploadResult
      if (uploadResult) {
        if(provider=="custom") {
          await Collection.updateById(id, {
            imageUrl,
            metaUrl,
            nftStorageType: provider
          })
        } else {
           await Collection.updateById(id, {
            ipfsImageHash,
            ipfsJsonHash,
            nftStorageType: provider
          })
        }

        
      }
      
      
      const res = {
       imageUrl: imageUrl || null,
       metaUrl: metaUrl || null,
       ipfsImageHash: ipfsImageHash || null ,
       ipfsJsonHash: ipfsJsonHash || null,
       nftStorageType: provider
     }

      return new APIResponse(201, res);
      
    } catch (ex) {

      console.log(ex)
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot upload to IPFS",
      });

    }

  },

  uploadCustomToken: async ({ body, params, files }) => {
    //TODO upload custom token
    try {

      //  const { id } = params
      const { collectionId, projectDir } = body




      const res = await Collection.findById(collectionId)
      const resAtt = map(res?.layers, function (e) {
        return {
          trait_type: e?.name,
          value: ""
        }
      })



      const imageDir = './folder/' + projectDir + "/" + `build/image`;
      const jsonDir = './folder/' + projectDir + "/" + `build/json`;

      //fsx.ensureDir(imageDir); // make directory
      await createDirectory(imageDir) // make directory

      // count lasted file index
      let lastedFileIndex = await countFilesInDir(imageDir) // image
      // lastedFileIndex = lastedFileIndex - 1



      let dateTime = Date.now();
      let metadataCustomTokenList = []

      for (let i = 0; i < files.length; i++) {
        const fileName = files[i].filename;


        await renameFile('./folder/' + fileName, imageDir + '/' + lastedFileIndex + ".png",)

        //TODO create json file

        let tempMetadata = {
          name: res?.name + '#' + lastedFileIndex,
          description: "",
          symbol: "",
          image: "",
          edition: lastedFileIndex,
          date: dateTime,
          attributes: resAtt,
          dna: "",
          rawImage: imageDir.substring(1) + '/' + lastedFileIndex + ".png",
          tokenType: "custom",
          customAttributes: [],
          qty: 1
        };

        metadataCustomTokenList.push(tempMetadata)

        lastedFileIndex++

      } // end loop

      // fsx.ensureDir(jsonDir) // mkdir
      await createDirectory(jsonDir)


      let metadata = []
      if (fs.existsSync(`${jsonDir}/metadata.json`)) {
        metadata = JSON.parse(fs.readFileSync(`${jsonDir}/metadata.json`, 'utf-8'));
        metadata = [...metadata, ...metadataCustomTokenList]
      } else {
        metadata = [...metadataCustomTokenList]

      }


      const result = await Collection.updateById(collectionId, { "maxPublicSupply":  metadata.length , "totalSupply": metadata.length});

      writeMetaData(JSON.stringify(metadata, null, 2), jsonDir);

      return new APIResponse(201, "upload ok");

    } catch (ex) {
      console.log(ex)
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot upload to image",
      });

    }

  },


  updateCollectionStatus: async ({ params, body }) => {
    const { id } = params;
    const { status } = body

    try {
      const res = await Collection.updateStatus({ id, status });

      return new APIResponse(201, res);
    } catch (ex) {
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot update status",
      });
    }
  },


  setPhase: async ({ params, body }) => {
    const { id } = params
    const { phaseNumber = "", whiteListAddress = [] } = body

    try {
      const res = await Collection.findByCollectionId(id)
      const { phase = [] } = res[0]
      
      const index = phase.findIndex((item) => item.phaseNumber == phaseNumber)
      
      let result = {}
      if(index < 0) {
        // add new phase
        let newPhase = [...phase]
        newPhase.push({ phaseNumber: phaseNumber, whiteListAddress: whiteListAddress })
        result = await Collection.updateById(id, { "phase": newPhase })
        
      } else {
        // update white list address
        let newPhase = [...phase]
        newPhase[index].whiteListAddress = whiteListAddress
        result = await Collection.updateById(id, { "phase": newPhase })
      }








      return new APIResponse(201, result);
    } catch (ex) {
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot update phase",
      });
    }
  },




}; //  end controller

export default controller;
