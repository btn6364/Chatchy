const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocationMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");


const app = express();
const server = http.createServer(app);
const io = socketio(server); //need server, so create a raw server

//set up port 
const port = process.env.PORT || 3000;

//set up directory
const publicDir = path.join(__dirname, "../public");

//use public directory to serve
app.use(express.static(publicDir));

io.on("connection", (socket) => {
    console.log("New Websocket connection!");

    //event listener
    socket.on("join", ({ username, room }, callback) => {
        const { error, user } = addUser( { id: socket.id, username: username, room: room });

        if (error) {
            //acknowledgement
            return callback(error);
        }

        socket.join(user.room);

        //send to just that socket
        socket.emit("message", generateMessage("Admin", "Welcome!"));
        //send info to all sockets but itself
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined room ${user.room}`));
        //socket.emit, io.emit, socket.broadcast.emit
        //io.to.emit, socket.broadcast.to.emit 

        io.to(user.room).emit("roomData", {
            room: user.room, 
            users: getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();
        if (filter.isProfane(message)){
            return callback("Profanity is not allowed!");
        }
    
        io.to(user.room).emit("message", generateMessage(user.username, message));
        callback();
    });


    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longtitude}`));
        callback();
    });


    socket.on("disconnect", () => {
        const removedUser = removeUser(socket.id);

        if (removedUser) {
           io.to(removedUser.room).emit("message", generateMessage("Admin", `${removedUser.username} has left!`));
            io.to(removedUser.room).emit("roomData", {
                room: removedUser.room, 
                users: getUsersInRoom(removedUser.room),
            });
        };
    });


});


server.listen(port, () => {
    console.log(`Listening to port ${port}...`);
});