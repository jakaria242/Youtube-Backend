// require('dotenv').config({path: "./env"})
import dotenv from 'dotenv'
dotenv.config({
    path: "./env"
})
import { app } from './app.js'
const port = process.env.PORT || 8000;
import connectDB from './db/index.js'

connectDB().then(()=>{
    
    try {
        app.listen(port, ()=>{
            console.log(`server is runing on ${port}`);
        })
    } catch (error) {
        
    }
 
}).catch((error)=>{
    console.log("MongoDb connection failed in server", error);
})





























/*

// ==============EFE======== Immediate function call===== semicolon(;)- must be add Otherwise error may comes
  

import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from  "express"
const app = express()


   ;( async () => {                                                     
   try {
      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
      app.on("error", (error)=>{
        console.log("prot not talk to database", error);
        throw error
      })

      app.listen(process.env.PORT, ()=>{
        console.log(`app is running on port ${process.env.PORT}`);
      })
   } catch (error) {
     console.log("ERROR ", error);
     throw error
   }
} )()
*/