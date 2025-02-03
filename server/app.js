import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

app.use(cors({
    origin: '*',
    credentials: true
}))

app.use(cookieParser())

app.use(express.json())

app.use(express.urlencoded({
    extended: true,
}))

app.use(express.static("public"))

import userRouter from './src/routes/user.routes.js'

app.use('/api/v1/users',userRouter)

export {
    app
}