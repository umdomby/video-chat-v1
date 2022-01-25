const express = require('express')
const app = express()
const servac = require('https')
const fs = require('fs');
const path = require('path')
const { v4: uuidV4 } = require('uuid')
app.set("view engine", "ejs");

app.use(express.static('public'))

const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/privkey.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/cert.pem'));
const ca = fs.readFileSync(path.resolve(__dirname,'./cert/chain.pem'));

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};
const server = servac.createServer(credentials, app);





const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});


const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));


app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});

server.listen(443);
