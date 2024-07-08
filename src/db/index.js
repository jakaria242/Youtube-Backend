import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const dbConnection = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
            console.log(`MongoDB Connected !! DB Host ${dbConnection.connection.host}`);
        
    } catch (error) {
        console.log("Mongodb connection Faild", error);
        process.exit(1) 
    }
}

export default connectDB