import express from "express";
import userRoute from "./user.route";
import collectionRoute from "./collection.route";


const router = express.Router();
router.use("/users", userRoute);
router.use("/collection" ,collectionRoute )


export default router;
