"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("./services/firebase");
const express = require('express');
const app = express();
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: true,
});
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(firebase_1.authenticateFirebaseUser);
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, firebase_1.validateFirebaseUser)(socket);
        next();
    }
    catch (error) {
        next(new Error('Auth token not valid!'));
    }
}));
io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId;
    socket.join(userId);
});
app.post('/googleAuth/:userId', (req, res) => {
    try {
        const userId = req.params.userId;
        const { data } = req.body;
        io.to(userId).emit('googleAuth', Object.assign({}, data));
        res.status(200).send('Success');
    }
    catch (error) {
        res.status(500).send(`Error happened: ${error.message}`);
    }
});
app.post('/submission/:formId', (req, res) => {
    try {
        const formId = req.query.formId;
        const { userId, answers } = req.body;
        io.to(userId).emit('submission', { userId, answers, formId });
        res.status(200).send('Success');
    }
    catch (error) {
        res.status(500).send(`Error happened: ${error.message}`);
    }
});
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
