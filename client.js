const io = require('socket.io-client')
const socket = io('http://localhost:4000/',{reconnect : true});
const socketMaster = io('http://localhost:8080/',{reconnect : true});
const MovieModel = require('./Movie_model');


//master-client operations

let metaData = {}

socketMaster.on('connect',() => {
    console.log('connected to the master successfully');
    socketMaster.emit('get-meta');
})


socketMaster.on('send-meta',(meta)=>{
    metaData = meta;
    console.log(meta);
})

socketMaster.on('update-meta',(meta)=>{
    metaData = meta;
    console.log(meta);
})






// server-client operations

const operation = 'ReadRows'
const movie = {title : 'Split'};
const cells = {'year' : 0};

socket.on('connect',() => { 
    console.log('Connected!');
});



//set of queries to be sent
if (meta !== {})
    socket.emit(operation, movie,cells); 

socket.on('successful',(message)=>{
    console.log(`the ${message} operation has been done successfully`);
});

socket.on('read' , (movies) => {
    movies.forEach(movie => {
        console.log(`the movie number ${movies.indexOf(movie)} is ${movie.title} and the year is ${movie.year}`);
    });
});


socket.on("disconnect", () => {
    console.log('disconnected from server'); // undefined
});