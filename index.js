// importing packages
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const db = require("./config/mongoose");
const bodyParser = require('body-parser');

const port = 8000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// setting layouts
app.use(expressLayouts);

// middleware for body-parser
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// accessing static files from assets folder
app.use(express.static('./assets'));

// setting up view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// setting up routes
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use('/', require('./routes'));

// socket.io connection
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// directing the app to the given port
app.listen(port, function (err) {
    if (err) {
        console.log('Error', err);
        return;
    }
    console.log('Server is up and running on port: ', port);
});
