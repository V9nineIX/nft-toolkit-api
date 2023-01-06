import fs from 'fs'

const getJsonDir = (projectDir) => {
    return `./folder/${projectDir}/build/json`
}

const createDirectory =  async(directory) => {
    return new Promise( async (resolve ,reject) => {  
        try{

            if (!fs.existsSync(directory)) {
                 fs.mkdirSync(directory ,{ recursive: true })
               resolve(true)
             }
             else{
                resolve(true)
             }
        


        }catch(ex){
            console.log(ex)
            reject(new Error("Can not create directory"))
        }

    })
} 


module.exports = {
    getJsonDir, 
    createDirectory 
}