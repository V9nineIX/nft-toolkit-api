import httpStatus from "http-status";
import Collection from "../models/collection.model";
import APIResponse from "../utils/api-response";
import APIError from "../utils/api-error";
import fsx from 'fs-extra';
import { startCreating } from '../libs/genarate'


const controller = {
  
  get: async () => {
    


    const layerConfigurations = [
        {
          growEditionSizeTo: 10,
          layersOrder: [
            { name: "Background" ,
                image:[{ 
                    name :"black" ,
                    rarity:100
                }]
            },
            { name: "Eyeball",
                image:[
                    { 
                        name :"Red",
                        title:"Red",
                        rarity:100
                    },
                    { 
                        name :"White" ,
                        title: "White",
                        rarity:1
                    }
               ],
            },
            { name: "Eyecolor",
                image:[
                    { 
                        name :"Cyan",
                        title:"Cyan",
                        rarity:1
                    },
                    { 
                        name :"Green" ,
                        title:"Green",
                        rarity:50
                    },
                    { 
                        name :"Pink" ,
                        title:"Pink",
                        rarity:1
                    },
                    { 
                        name :"Purple",
                        title:"Purple",
                        rarity:1
                    },
                    { 
                        name :"Red",
                        title:"Red",
                        rarity:50
                    },
                    { 
                        name :"Yellow" ,
                        title: "Yellow",
                        rarity:1
                    }
               ],
            },
            { name: "Iris" , image:[]},
            { name: "Shine", image:[] },
            { name: "Bottom lid" ,image:[]  },
            { name: "Top lid" ,image:[] },
          ],
        }
      ];


    const res  = await startCreating({ layerConfigurations })
    console.log("res",res)

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
    const { ownerId } = params;
    try {
      const collection = await Collection.findByOwnerId(ownerId);
      return new APIResponse(201,  collection );
    } catch (ex) {
      throw new APIError({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Cannot find collection by ownerId",
      });
    }
  },

  genarateImage: async({ body ,params }) => {

    try{
    const { id } = params
    const { data } = body
    const  res    =  collection.updateById(id ,data)  
    console.log("res" ,res) 

        
    }catch(ex){
        throw new APIError({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: "Cannot genarate image",
          });

    }

  }
  
}; //  end controller

export default controller;
