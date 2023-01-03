const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const server = http.createServer(app);
require("dotenv").config();
const path = require("path");
const socket = require("socket.io")
    // const { Server } = require("socket.io");
    // const io = new Server({
    //     cors: true
    // })

const server = app.listen(9000, () => {
    console.log(`server is listening on port ${9000}`);
    console.log(`http://localhost:${9000}`);
});
const io = socket(server, {
    cors: {
        origin: '*',
        credentials: true
    },transports : ['polling']
});


app.use(helmet());
app.use(express.urlencoded({ extended: false }))
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.send("Hello");
});

const users = {};

const socketToRoom = {};

io.on('connection', socket => {
    console.log("connected")
    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        console.log("sending signal")
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        console.log("returning signal")
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        socket.broadcast.emit('user left', socket.id)
    });

    socket.on('change', (payload) => {
        socket.broadcast.emit('change', payload)
    });

});



// app.listen(9000, () => console.log("Running at port 8000"))
// io.listen(9001)
