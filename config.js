import dotenv from "dotenv";

dotenv.config();

const config = {
  server: {
    host: process.env.SERVER_IP || "localhost",
    port: process.env.SERVER_PORT || 3333,
  },
  database: {
    name: "database",
    host: process.env.MONGODB_IP || "localhost",
    port: process.env.MONGODB_PORT || 27017,
    username: process.env.MONGODB_USERNAME || "admin",
    password: process.env.MONGODB_PASSWORD || "admin",
    options: {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    },
  },
  redis:{
    host: process.env.SERVER_IP || "localhost",
    port: process.env.REDIS_PORT || "6379",
    url : process.env.REDIS_URL || "redis://127.0.0.1:6379"
  },
  pinataKey:{
    apiKey: process.env.PINNATA_API_KEY,
    apiSecretKey: process.env.PINNATA_SECRECT_KEY
  },
  nftStorageKey:{
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEJkNjkxMjY0NDEyMDA0YzM0RUZCN0M5RjliMEE5OEE4ZDFiRTY3QUEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NDgwOTAzNzM3OCwibmFtZSI6Im5mdCJ9.0QshVOyQjjTY0-9fiKpp0DG-MfTwpcXBL1JAEDhGIZo"
  } 
};

// if (process.env.NODE_ENV === "production") {
//   config.database.options = {
//     ...config.database.options,
//     authSource: "admin",
//     auth: {
//       username: config.database.username,
//       password: config.database.password,
//     },
//   };
// } else if (process.env.NODE_ENV === "test") {
//   config.database.name += "-test";
//   config.server.port = 3456;
// }

config.database.uri = `mongodb://${config.database.host}:${config.database.port}/${config.database.name}`;

export default config;
