import express from "express";
import mongoose from "mongoose";
import log from "./utils/logger";
import config from "../config";
import route from "./routers";
import bodyParser from "body-parser";
const path = require('path')
import cors from "cors"
import { ApolloServer  , gql } from "apollo-server-express";
// import { graphqlHTTP } from 'express-graphql'
// import { buildSchema } from 'graphql'


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




// app.use('/graphql', graphqlHTTP({
//     schema: schema,
//     rootValue: root,
//     graphiql: true,
//   }));


grapQLServer.applyMiddleware({ app });
app.use(cors())
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


log(app);
route(app);



app.use('/uploads', express.static('uploads'));
//app.use(express.static('folder'))
app.use('/folder', express.static(path.join(__dirname, 'folder')))



app.listen(server.port, server.host, () =>
  console.log(`Server has started on ${server.host}:${server.port} ${grapQLServer.graphqlPath}`)
);



export default app;
