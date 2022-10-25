import { initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import dotenv from 'dotenv'
import { Request, Response, NextFunction } from 'express'
import { Socket } from 'socket.io'

dotenv.config()

// cloud run is weird with env variables
const private_key = process.env.DEVELOPMENT_MODE
  ? process.env.ADMIN_PRIVATE_KEY
  : JSON.parse(process.env.ADMIN_PRIVATE_KEY || '')

const serviceAccount = {
  type: process.env.ADMIN_TYPE,
  private_key,
  project_id: process.env.ADMIN_PROJECT_ID as string,
  private_key_id: process.env.ADMIN_PRIVATE_KEY_ID,
  client_email: process.env.ADMIN_CLIENT_EMAIL,
  client_id: process.env.ADMIN_CLIENT_ID,
  auth_uri: process.env.ADMIN_AUTH_URI,
  token_uri: process.env.ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.ADMIN_CLIENT_X509_CERT_URL,
} as any

const app = initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

const getAuthToken = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] === 'Bearer'
  ) {
    req.authToken = req.headers.authorization.split(' ')[1]
  } else {
    req.authToken = undefined
  }
  next()
}

const authenticateFirebaseUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  getAuthToken(req, res, async () => {
    try {
      const { authToken } = req
      if (!authToken) {
        throw new Error('No auth token')
      }
      const decodedToken = await getAuth().verifyIdToken(authToken)
      req.userId = decodedToken.uid
      return next()
    } catch (error) {
      return res.status(401).send({ error: 'Not authorized' })
    }
  })
}

const validateFirebaseUser = async (socket: Socket) => {
  const authToken = socket.handshake.auth.authToken
  if (authToken.startsWith('Bearer')) {
    const token = await getAuth().verifyIdToken(authToken.split(' ')[1])
    socket.handshake.auth.userId = token.uid
  } else {
    throw new Error('Invalid token')
  }
}

export { app, db, authenticateFirebaseUser, validateFirebaseUser }
