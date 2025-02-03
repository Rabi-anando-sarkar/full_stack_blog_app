import mongoose from "mongoose";
import { DB_NAME } from "../../constant.js"; 

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`)
        console.log(`MONGO DATABASE SUCCESFULLY CONNECTED`);
        
    } catch (error) {
        console.log(`MONGO DATABASE CONNECTION FAILED :: ${error}`);
        process.exit(1)
    }
}

export {
    connectDB
}