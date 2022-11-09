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
const upload = multer({ storage: storage })


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
 *               example: CollectionA
 *             ownerId:
 *               type: string
 *               description: Owner ID
 *               example: 0952648493
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

router.route("/uploadImage").post(upload.array('files', 12), handle(controller.uploadMultiple));



// ========= find by ownerId ========= //
/**
 * @swagger
 * /v1/collection/owner/{id}:
 *   get:
 *     tags: [Collection]
 *     summary: get by ownerId
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ownerID
 *         schema:
 *           type: string
 *           example: 0952648493
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
router.route("/owner/:id").get(handle(controller.findByOwnerId));



// ========= find by ownerId ========= //
/**
 * @swagger
 * /v1/collection/{id}:
 *   get:
 *     tags: [Collection]
 *     summary: get by id
 *     parameters:
 *       - in: path
 *         name: id
 *         description: collectionID
 *         schema:
 *           type: string
 *           example: 5df206f819f1802f7e158f73
 *     responses:
 *       200:
 *         description: Return get collection by id
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               $ref: '#/definitions/User'
 *             version:
 *               type: string
 *               example: 1.0.0
 */
router.route("/:id").get(handle(controller.findByCollectionId));


/**
 * @swagger
 * /v1/collection/generateImage/{id}:
 *   put:
 *     tags: [Collection]
 *     summary: genarateImage
*     parameters:
 *       - in: path
 *         name: id
 *         description: Collection Id
 *         schema:
 *           type: string
 *           example: 635f93c13058f3148ec59d6b
 *       - in: body
 *         name: body
 *         description: Collection's information
 *         schema:
 *           type: object
 *     responses:
 *       201:
 *         description: Return status create collection
 *         schema:
 *           type: object
 */
router.route("/generateImage/:id").put(handle(controller.generateImage));


/**
 * @swagger
 * /v1/collection/generateCollection/{id}:
 *   put:
 *     tags: [Collection]
 *     summary: genarate colection
*     parameters:
 *       - in: path
 *         name: id
 *         description: Collection Id
 *         schema:
 *           type: string
 *           example: 635f93c13058f3148ec59d6b
 *       - in: body
 *         name: body
 *         description: Collection's information
 *         schema:
 *           type: object
 *     responses:
 *       201:
 *         description: Return status create collection
 *         schema:
 *           type: object
 */
router.route("/generateCollection/:id").put(handle(controller.generateCollection));


/**
 * @swagger
 * /v1/collection/{id}:
 *   put:
 *     tags: [Collection]
 *     summary: update collection by id
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Collection Id
 *         schema:
 *           type: string
 *           example: 635f93c13058f3148ec59d6b
 *       - in: body
 *         name: body
 *         description: Collection's information
 *         schema:
 *           type: object
 *     responses:
 *       201:
 *         description: Return update collection
 *         schema:
 *           type: object
 */
router.route("/:id").put(handle(controller.updateCollectionById));


/**
 * @swagger
 * /v1/collection/removeLayer/{id}:
 *   delete:
 *     tags: [Collection]
 *     summary: Delete an layer collection
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Layer Bg collection's ID
 *         schema:
 *           type: string
 *           example: 6363799d569ae632e4149815
 *     responses:
 *       200:
 *         description: Return deleted layer collection
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               $ref: '#/definitions/User'
 *             version:
 *               type: string
 *               example: 1.0.0
 */
router.route("/removeLayer/:id").post(handle(controller.removeLayerById));


export default router;
