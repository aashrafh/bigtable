const express = require("express");
const app = express();
const http = require("http");
const tabletServer = http.createServer(app);

const mongoose = require("mongoose");
const MovieModel = require("../Movie_model");
const constants = require("../scripts/constants");

const masterURL = "http://localhost:8080";
const ioClient = require("socket.io-client");
const ioServer = require("socket.io");

let master = null;
let tablets = [];
let port = 3000;
let serverIndex = 0;

mongoose.connect(`${constants.connectionString}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const readRows = async (movie) => {
  let { year, title } = movie;
  return await MovieModel.find({ year: year, title: title }).sort({ year: 1 });
};

const addRow = async (movie) => {
  let movieToSave = new MovieModel(movie);
  return await movieToSave.save();
};

const deleteRows = async (movie) => {
  return await MovieModel.deleteOne({ year: movie.year, title: movie.title });
};

const deleteCells = async (movie, cells) => {
  return await MovieModel.updateOne(movie, {
    $unset: cells,
  });
};

const setRow = async (movie) => {
  return await MovieModel.updateOne(
    { title: movie.title, year: movie.year },
    {
      $set: movie,
    }
  );
};

function connectToClient() {
  if (tabletServer.listening) tabletServer.close();

  tabletServer.listen(port, () => {
    console.log("Tablet server has started for client connections");

    const tabletSocket = ioServer(tabletServer);
    tabletSocket.on("connection", (socket) => {
      socket.on("Set", async (Movie) => {
        console.log(`set operation`);
        const movie = await setRow(Movie);
        if (movie !== null) {
          socket.emit("successful", "Set Rows");
          master.emit("operation", "successfully", "Set Cells", serverIndex);
          console.log("Successfull Set: ", movie);
        } else {
          socket.emit("unsuccessful", "Set Rows");
          master.emit("operation", "unsuccessfully", "Set Cells", serverIndex);
        }
      });

      socket.on("AddRow", async (Movie) => {
        console.log(`add row operation`);
        const movie = await addRow(Movie);
        if (movie !== null) {
          socket.emit("successful", "Add Row");
          master.emit("operation", "successfully", "Add Row", serverIndex);
          console.log("Successfull AddRow: ", movie);
        } else {
          socket.emit("unsuccessful", "Add Row");
          master.emit("operation", "unsuccessfully", "Add Row", serverIndex);
        }
      });

      socket.on("DeleteCells", async (Movie, Cells) => {
        console.log(`delete cells operation`);
        const movie = await deleteCells(Movie, Cells);
        if (movie !== null) {
          socket.emit("successful", "delete Cells");
          master.emit("operation", "successfully", "delete cells", serverIndex);
          console.log("Successfull DeleteCells: ", movie);
        } else {
          socket.emit("unsuccessful", "delete Cells");
          master.emit(
            "operation",
            "unsuccessfully",
            "delete Cells",
            serverIndex
          );
        }
      });

      socket.on("DeleteRow", async (Movie) => {
        console.log(`delete row operation`);
        const movie = await deleteRows(Movie);
        if (movie !== null) {
          socket.emit("successful", "delete Row");
          master.emit("operation", "successfully", "delete Row", serverIndex);
          console.log("Successfull DeleteRow: ", movie);
        } else {
          socket.emit("unsuccessful", "delete Row");
          master.emit("operation", "unsuccessfully", "delete Row", serverIndex);
        }
      });

      socket.on("ReadRows", async (Movie) => {
        console.log(`read rows operation`);
        const movie = await readRows(Movie);
        //const movie = serverTablets[serverTablets.findIndex((tablet) => { return tablet.title == Movie.title })];
        if (movie !== null) {
          socket.emit("successful", "Read Row");
          // socket.emit("read", movies);
          master.emit("operation", "successfully", "Read Row", serverIndex);
          console.log("Successfull ReadRows: ", movie);
        } else {
          socket.emit("unsuccessful", "Read Row");
          master.emit("operation", "unsuccessfully", "Read Row", serverIndex);
        }
      });
    });
  });
}

function connectToMaster() {
  const masterSocket = ioClient(masterURL);
  masterSocket.on("connect", () => {
    console.log("Connected to the master");
    // masterSocket.emit("Server");
    masterSocket.on("sendTablets", (res) => {
      tablets = res.tablets;
      if (res.index == 1) port = 4000;
      serverIndex = res.index;
      console.log("Recieved number of tablets = ", tablets.length);
      connectToClient();
    });
  });
  master = masterSocket;
}

connectToMaster();
