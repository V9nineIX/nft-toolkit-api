import express from "express";
import mongoose from "mongoose";
import log from "./utils/logger";
import config from "../config";
import route from "./routers";
import bodyParser from "body-parser";
const path = require('path')

const { server, database } = config;
mongoose.connect(database.uri, database.options);

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

log(app);
route(app);

app.use('/uploads', express.static('uploads'));
//app.use(express.static('folder'))
app.use('/folder', express.static(path.join(__dirname, 'folder')))

app.listen(server.port, server.host, () =>
  console.log(`Server has started on ${server.host}:${server.port}`)
);

export default app;
