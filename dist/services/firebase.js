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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFirebaseUser = exports.authenticateFirebaseUser = exports.db = exports.app = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// cloud run is weird with env variables
const private_key = process.env.DEVELOPMENT_MODE
    ? process.env.ADMIN_PRIVATE_KEY
    : JSON.parse(process.env.ADMIN_PRIVATE_KEY || '');
const serviceAccount = {
    type: 'service_account',
    private_key,
    project_id: process.env.ADMIN_PROJECT_ID,
    private_key_id: process.env.ADMIN_PRIVATE_KEY_ID,
    client_email: process.env.ADMIN_CLIENT_EMAIL,
    client_id: process.env.ADMIN_CLIENT_ID,
    auth_uri: process.env.ADMIN_AUTH_URI,
    token_uri: process.env.ADMIN_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.ADMIN_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.ADMIN_CLIENT_X509_CERT_URL,
};
const app = (0, app_1.initializeApp)({
    credential: (0, app_1.cert)(serviceAccount),
});
exports.app = app;
const db = (0, firestore_1.getFirestore)();
exports.db = db;
const getAuthToken = (req, res, next) => {
    if (req.headers.authorization &&
        req.headers.authorization.split(' ')[0] === 'Bearer') {
        ;
        req.authToken = req.headers.authorization.split(' ')[1];
    }
    else {
        ;
        req.authToken = null;
    }
    next();
};
const authenticateFirebaseUser = (req, res, next) => {
    getAuthToken(req, res, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { authToken } = req;
            const decodedToken = yield (0, auth_1.getAuth)().verifyIdToken(authToken);
            req.userId = decodedToken.uid;
            return next();
        }
        catch (error) {
            console.log('error ', error.message);
            return res.status(401).send({ error: 'Not authorized' });
        }
    }));
};
exports.authenticateFirebaseUser = authenticateFirebaseUser;
const validateFirebaseUser = (socket) => __awaiter(void 0, void 0, void 0, function* () {
    const authToken = socket.handshake.auth.authToken;
    if (authToken.startsWith('Bearer')) {
        const token = yield (0, auth_1.getAuth)().verifyIdToken(authToken.split(' ')[1]);
        socket.handshake.auth.userId = token.uid;
    }
    else {
        throw new Error('Invalid token');
    }
});
exports.validateFirebaseUser = validateFirebaseUser;
