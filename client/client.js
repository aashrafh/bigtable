const ioClient = require("socket.io-client");

const masterURL = "http://localhost:8080";

let metadata = {};
let master = null;

function connectToMaster() {
  const masterSocket = ioClient(masterURL);

  masterSocket.on("connect", () => {
    masterSocket.on("sendMeta", (meta) => {
      metadata = meta;
      console.log("Client: Successfully recieved metadata", metadata);
      if (metadata) {
        const operation = "ReadRows";
        const movie = { title: "Split", year: "2016" };
        const serverSocket = connectToServer(movie);

        serverSocket.emit(operation, movie);
      }
    });
  });

  master = masterSocket;
}

function connectToServer({ year }) {
  let port = 4000;
  if (
    year >= metadata.firstServer.range.startYear &&
    year <= metadata.firstServer.range.endYear
  ) {
    port = 3000;
  }

  return ioClient(`http://localhost:${port}`);
}

connectToMaster();
