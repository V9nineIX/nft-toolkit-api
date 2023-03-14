import fs from 'fs'
import fsextra from 'fs-extra'
import { COLECTION_ROOT_FOLDER } from "../constants"

const getJsonDir = (projectDir) => {
    return `./${COLECTION_ROOT_FOLDER}/${projectDir}/build/json`
}

const getJsonFullDir = (projectDir) => {
    return `${process.cwd()}/${COLECTION_ROOT_FOLDER}/${projectDir}/build/json`
}

const getImageDir = (projectDir) => {
    return `${process.cwd()}/${COLECTION_ROOT_FOLDER}/${projectDir}/build/image`
}

const getProjectDir = (projectDir) => {
    return `${process.cwd()}/${COLECTION_ROOT_FOLDER}/${projectDir}`
}

const createDirectory = async (directory) => {
    return new Promise(async (resolve, reject) => {
        try {

            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true })
                resolve(true)
            }
            else {
                resolve(true)
            }



        } catch (ex) {
            console.log(ex)
            reject(new Error("Can not create directory"))
        }

    })
}

const copyDirectory = async (sourceFolder, destinationFolder) => {
    return new Promise(async (resolve, reject) => {
        console.log(" destinationFolder", destinationFolder)

        fsextra.copy(sourceFolder, destinationFolder, (err) => {
            if (err) {
                console.error(err);
                reject(err)
            } else {
                resolve(true)
                console.log(`Successfully copied ${sourceFolder} to ${destinationFolder}`);
            }
        });
    })

}


module.exports = {
    getJsonDir,
    getJsonFullDir,
    createDirectory,
    copyDirectory,
    getImageDir,
    getProjectDir
}