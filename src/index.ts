import { Socket } from 'socket.io'
import {
  authenticateFirebaseUser,
  db,
  validateFirebaseUser,
} from './services/firebase'
const express = require('express')
const app = express()
const cors = require('cors')
const http = require('http')
const dotenv = require('dotenv')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, {
  cors: true,
})
dotenv.config()
app.use(cors())
app.use(express.json())

io.use(async (socket: Socket, next: any) => {
  try {
    await validateFirebaseUser(socket)
    next()
  } catch (error) {
    next(new Error('Auth token not valid!'))
  }
})

io.on('connection', (socket: any) => {
  const userId = socket.handshake.auth.userId
  socket.join(userId)
})

app.post(
  '/googleAuth/:userId',
  authenticateFirebaseUser,
  (req: any, res: any) => {
    try {
      const userId = req.params.userId
      const { data } = req.body
      io.to(userId).emit('googleAuth', { ...data })

      res.status(200).send('Success')
    } catch (error: any) {
      res.status(500).send(`Error happened: ${error.message}`)
    }
  }
)

app.post('/submission/:formId', async (req: any, res: any) => {
  try {
    const { answers, userId, apiToken } = req.body

    if (apiToken !== process.env.SUBMISSION_API_TOKEN) {
      throw new Error('Invalid api token.')
    }

    io.to(userId).emit('submission', { ...answers })

    res.status(200).send('Success')
  } catch (error: any) {
    res.status(500).send(`Error happened: ${error.message}`)
  }
})

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
