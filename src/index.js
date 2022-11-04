import express from "express";
import mongoose from "mongoose";
import log from "./utils/logger";
import config from "../config";
import route from "./routers";
import bodyParser from "body-parser";
const path = require('path')
import cors from "cors"
import { ApolloServer, gql } from "apollo-server-express";
import { isEmpty } from "lodash";
// import { graphqlHTTP } from 'express-graphql'
// import { buildSchema } from 'graphql'
const http = require('http');
const socketIo = require("socket.io");
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
import { orderQueue } from "./queues/order-queue"
import queueListeners from "./queues/queueListeners";


const grapQLServer = new ApolloServer({
  playground: true,
  typeDefs: gql`
      type Query {
        hello: String
      }
    `,
  resolvers: {
    Query: {
      hello: () => 'Hello world!',
    },
  }
})


// Construct a schema, using GraphQL schema language
// const schema = buildSchema(`
// type Query {
//   hello: String
// }
// `);

// // The root provides a resolver function for each API endpoint
// const root = {
//     hello: () => {
//       return 'Hello world!';
//     },
// };




const { server, database } = config;
mongoose.connect(database.uri, database.options);

const app = express();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/bull');

createBullBoard({
    queues: [new BullAdapter(orderQueue)],
    serverAdapter,
  });



// app.use('/graphql', graphqlHTTP({
//     schema: schema,
//     rootValue: root,
//     graphiql: true,
//   }));


grapQLServer.applyMiddleware({ app });
app.use(cors())
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/folder', express.static('folder'));

app.use("/bull" , serverAdapter.getRouter())



const httpServer = http.createServer(app);
const io = socketIo(httpServer , { cors: { origin: "*" } }); 

app.use((req, res, next) => {
    req.io = io;
    return next();
  });


io.on('connection', (socket) => {
    const { ownerId = null} =socket.handshake.query
    console.log('user connected' ,socket.handshake.query.ownerId);

    socket.on('disconnect', function () {
      console.log('user disconnected');
    });
})


io.use((socket, next) => {
    if ( !isEmpty(socket.handshake.query.ownerId)) {
      next();
    } else {
      next(new Error("invalid"));
    }
});


queueListeners()

// queuelistener()
//  
// orderQueue.on('completed', (job, result) => {
//     console.log("Job Completed: ", "Result: ", result); 
//     //TODO emit  to clinent
// })

log(app);
route(app);




httpServer.listen(server.port, server.host, () =>
  console.log(`Server has started on ${server.host}:${server.port} ${grapQLServer.graphqlPath}`)
);



export default app;
