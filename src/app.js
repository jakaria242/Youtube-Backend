import express, { urlencoded } from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";

const app = express()

//==========middleware =========================
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))
app.use(express.json({ limit: '16kb'}))
app.use(express.urlencoded({ limit: '16kb', extended: true}))
app.use(express.static("public"))
app.use(cookieParser())
//==========middleware =========================

///=========routes import =====================
import userRouter from "./routes/user.routes.js";
///=========routes import =====================

/// ============routes declaration ==============
app.use("/api/v1/users", userRouter)


export  {app}