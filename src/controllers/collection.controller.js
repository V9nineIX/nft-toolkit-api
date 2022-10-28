import httpStatus from "http-status";
import Collection from "../models/collection.model";
import APIResponse from "../utils/api-response";
import APIError from "../utils/api-error";
import fsx from 'fs-extra';


const controller = {
  
  get: async () => {

    //const col = await Collection.add({ "name":"peter" ,"age":20 })
   return new APIResponse(200, "Hello Collection API ....");
    // throw new APIError({
    //   status: httpStatus.NOT_FOUND,
    //   message: "user not found",
    // });
  },

  create: async ({ body }) => {

    try {
        const colResult = await Collection.add(body);
        //TODO :  create folder
        const projectName = body.name;
        const ownerId = body.ownerId
        const projectDir = ownerId+'-'+projectName 
        const createDir = './folder/'+projectDir;
        fsx.ensureDir(createDir);
    
    if(colResult) {
        return new APIResponse(201, { 
            projectDir ,
            projectName 
        });
    }
    }catch(ex){

        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: "Cannot create Collection",
          });
    }
  },

  uploadMultiple: async(req) => {
   // console.log("body" , body)
   //console.log("req", req.body.layer)
   //console.log(JSON.stringify(req.files))

   try {

    const layerName = req.body.layer;
    const projectDir = req.body.projectDir;
    const createDir = './folder/'+projectDir+"/"+layerName;
 
    fsx.ensureDir(createDir);
 
    for(var i=0;i<req.files.length;i++){
     const fileName = req.files[i].filename;
     fsx.move('./folder/' + fileName, createDir + '/' + fileName, function (err) {
         if (err) {
              console.error(err);
         }else{
             console.log("move file finish")
         }
     });
 
    }
 
    return new APIResponse(200, "Upload OK");

   }catch(ex){
     console.log("ex" ,ex)
   
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
      return new APIResponse(201,  collection );
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
      return new APIResponse(201,  res );
    } catch (ex) {
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot find collection by id",
      });
    }
  },
  
}; //  end controller

export default controller;
