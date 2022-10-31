import express from "express";
import controller from "../../controllers/collection.controller";
import { handle } from "../../utils/api-handler";
import multer from "multer";
import fsx from 'fs-extra';


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './folder')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})
const  upload = multer({ storage: storage })


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Collection
 */

/**
 * @swagger
 * /v1/collection:
 *   get:
 *     tags: [Collection]
 *     summary: Get test hello
 *     responses:
 *       200:
 *         description: Return a list of users
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/User'
 *             version:
 *               type: string
 *               example: 1.0.0
 */
router.route("/").get(handle(controller.get));


/**
 * @swagger
 * /v1/collection:
 *   post:
 *     tags: [Collection]
 *     summary: create
 *     parameters:
 *       - in: body
 *         name: body
 *         description: collection info
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: Name
 *               example: Jack
 *     responses:
 *       201:
 *         description: Return created user
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               $ref: '#/definitions/User'
 *             version:
 *               type: string
 *               example: 1.0.0
 */
 router.route("/").post(handle(controller.create));



/**
 * @swagger
 * UploadImage:
 *   post:
 *     tags: [Collection]
 *     summary: upload
 *     responses:
 *       200:
 *         description: Return a list of users
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/User'
 *             version:
 *               type: string
 *               example: 1.0.0
 */

router.route("/uploadImage").post(upload.array('profile-files', 12), handle(controller.uploadMultiple));



// ========= find by ownerId ========= //
/**
 * @swagger
 * /v1/collection/{ownerId}:
 *   get:
 *     tags: [Collection]
 *     summary: get by ownerId
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         description: ownerID
 *         schema:
 *           type: string
 *           example: 5df206f819f1802f7e158f73
 *     responses:
 *       200:
 *         description: Return get collection by ownerId
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               $ref: '#/definitions/User'
 *             version:
 *               type: string
 *               example: 1.0.0
 */
router.route("/:ownerId").get(handle(controller.findByOwnerId));




/**
 * @swagger
 * /v1/collection/genarateImage:
 *   put:
 *     tags: [Collection]
 *     summary: genarateImage
 *     parameters:
 *       - in: body
 *         name: body
 *         description: collection info
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: Name
 *               example: Jack
 *     responses:
 *       201:
 *         description: Return created user
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               $ref: '#/definitions/User'
 *             version:
 *               type: string
 *               example: 1.0.0
 */
 router.route("genarateImage/:id").put(handle(controller.genarateImage));


export default router;
