import httpStatus from "http-status";
import Collection from "../models/collection.model";
import APIResponse from "../utils/api-response";
import APIError from "../utils/api-error";
import fsx from 'fs-extra';

const controller = {
  
  get: async () => {

    //const col = await Collection.add({ "name":"peter" ,"age":20 })
   return new APIResponse(200, "Hello");
    // throw new APIError({
    //   status: httpStatus.NOT_FOUND,
    //   message: "user not found",
    // });
  },

  uploadMultiple: async(req) => {
   // console.log("body" , body)
   console.log("req", req.body.layer)
   console.log(JSON.stringify(req.files))

   try {

    const layerName = req.body.layer;
    const createDir = './folder/'+layerName;
 
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


  } //  end upload function
  
}; //  end controller

export default controller;
