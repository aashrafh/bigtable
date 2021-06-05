const io = require('socket.io-client')
const socket = io('http://localhost:4000/',{reconnect : true});
const MovieModel = require('./Movie_model');
let metaData = {}

const operation = 'ReadRows'
const movie = {title : 'Split'};
const cells = {'year' : 0};
// Add a connect listener
socket.on('connect',() => { 
    console.log('Connected!');
});


socket.on('metaData',(metaData) => { // this for receiving the meta data from the master upon connection or upon update
    metaData = this.metaData
})

//set of queries to be sent
socket.emit(operation, movie,cells); // send a read request

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