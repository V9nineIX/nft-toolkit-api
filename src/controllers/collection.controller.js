import httpStatus from "http-status";
import Collection from "../models/collection.model";
import APIResponse from "../utils/api-response";
import APIError from "../utils/api-error";
import fsx from 'fs-extra';
import { startCreating } from '../libs/genarate'
import { last } from "lodash";
import { addGenerateImageQueue } from "../queues/generate-image-queue";
import { GENERATE_COLLECTION, GENERATE_IMAGE } from "../constants";

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
      for (var i = 0; i < req.files.length; i++) {
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
      paramCollection.status = "active"
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
        const {layersElement ,ownerId=null, projectDir:dir, totalSupply ,collection} = body
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

  }


}; //  end controller

export default controller;
