const ioClient = require("socket.io-client");
const { firstTestCase } = require("./testcases");

const masterURL = "http://localhost:8000";

let metadata = {};
let master = null;

function connectToMaster() {
  const masterSocket = ioClient(masterURL);

  masterSocket.on("connect", () => {
    // masterSocket.emit("CLient");
    masterSocket.on("sendMeta", (meta) => {
      metadata = meta;
      console.log("Client: Successfully received metadata", metadata);
      if (metadata) {
        const firstCaseTester = clientTest1(0);
        for (let i = 0; i < 10; i++) {
          const { operation, movie , cells } = firstCaseTester.next().value;
          const serverSocket = connectToServer(movie);

          serverSocket.emit(operation, movie,cells);
        }
      }
    });

    masterSocket.on("updateMeta", (meta) => {
      metadata = meta;
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

function* clientTest1(i) {
  const { operations, movies,cells } = firstTestCase;

  for (; i < operations.length; i++) {
    yield {
      operation: operations[i],
      movie: movies[i],
      cells : cells[i]
    };
  }
}
