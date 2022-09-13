const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const socket = require("./socket");

dotenv.config({ path: "./config.env" });

// Connect mongoose
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connected"));

//SERVER

const httpSever = createServer(app);

const io = new Server(httpSever, {
  cors: {
    credentials: true,
  },
});

const port = process.env.PORT || 8000;
httpSever.listen(port, () => {
  console.log(`App is running on port ${port}...`);

  socket({ io });
});
