const express = require("express");
const app = express();
const http = require("http");
const tabletServer = http.createServer(app);

const mongoose = require("mongoose");
const MovieModel = require("./Movie_model");
const constants = require("./scripts/constants");

const masterURL = "http://localhost:8080";
const ioClient = require("socket.io-client");
const ioServer = require("socket.io");

let master = null;
let tablets = [];
let port = 3000;

mongoose.connect(`${constants.connectionString}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const readRows = async (movie) => {
  return await MovieModel.find({ title: movie.title }).sort({ year: 1 });
};

const addRow = async (movie) => {
  let movieToSave = new MovieModel(movie);
  return await movieToSave.save();
};

const deleteRows = async (movie) => {
  return await MovieModel.deleteOne({ title: movie.title });
};

const deleteCells = async (movie, cells) => {
  return await MovieModel.updateOne(movie, {
    $unset: cells,
  });
};

const setRow = async (movie) => {
  return await MovieModel.updateOne(
    { title: movie.title },
    {
      $set: movie,
    }
  );
};

function connectToClient() {
  tabletServer.listen(port, () => {
    console.log("Tablet server has started for client connections");

    const tabletSocket = ioServer(tabletServer);
    tabletSocket.on("connection", (socket) => {
      socket.on("Set", async (Movie) => {
        console.log(`set operation`);
        const movie = await setRow(Movie);
        if (movie !== null) {
          socket.emit("successful", "Set Rows");
          socketClient.emit("operation", "successfully", "Set Cells", movie);
        } else {
          socket.emit("unsuccessful", "Set Rows");
          socketClient.emit("operation", "unsuccessfully", "Set Cells", movie);
        }
      });

      socket.on("AddRow", async (Movie) => {
        console.log(`add row operation`);
        const movie = await addRow(Movie);
        if (movie !== null) {
          socket.emit("successful", "Add Row");
          socketClient.emit("operation", "successfully", "Add Row", movie);
        } else {
          socket.emit("unsuccessful", "Add Row");
          socketClient.emit("operation", "unsuccessfully", "Add Row", movie);
        }
      });

      socket.on("DeleteCells", async (Movie, Cells) => {
        console.log(`delete cells operation`);
        const movie = await deleteCells(Movie, Cells);
        if (movie !== null) {
          socket.emit("successful", "delete Cells");
          socketClient.emit(
            "operation",
            "successfully",
            "delete cells",
            movie,
            cells
          );
        } else {
          socket.emit("unsuccessful", "delete Cells");
          socketClient.emit(
            "operation",
            "unsuccessfully",
            "delete Cells",
            movie,
            cells
          );
        }
      });

      socket.on("DeleteRow", async (Movie) => {
        console.log(`delete row operation`);
        const movie = await deleteRows(Movie);
        if (movie !== null) {
          socket.emit("successful", "delete Row");
          socketClient.emit("operation", "successfully", "delete Row", movie);
        } else {
          socket.emit("unsuccessful", "delete Row");
          socketClient.emit("operation", "unsuccessfully", "delete Row", movie);
        }
      });

      socket.on("ReadRows", async (Movie) => {
        console.log(`read rows operation`);
        const movies = await readRows(Movie);
        //const movie = serverTablets[serverTablets.findIndex((tablet) => { return tablet.title == Movie.title })];
        if (movies !== null) {
          socket.emit("successful", "Read Row");
          socket.emit("read", movies);
          socketClient.emit("operation", "successfully", "Read Row", movies);
        } else {
          socket.emit("unsuccessful", "Read Row");
          socketClient.emit("operation", "unsuccessfully", "Read Row", movies);
        }
      });
    });
  });
}

function connectToMaster() {
  const masterSocket = ioClient(masterURL);
  masterSocket.on("connect", () => {
    console.log("Connected to the master");
    masterSocket.on("send-tablets", (res) => {
      tablets = res.tablets;
      if (res.index == 1) port = 4000;
      console.log("Recieved number of tablets = ", tablets.length);
      connectToClient();
    });
  });
  master = masterSocket;
}

connectToMaster();

// 1- When to emit 'serverWrite' event ?
// 2- We need to lock server operations
