import dotenv from "dotenv";
import {app } from "./app.js";
import mongoose from "mongoose";

dotenv.config({path: "./src/.env"});

const PORT = process.env.PORT 

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})



const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGO_URI);
        console.log(`\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error: ", error);
        process.exit(1);
    }
}

connectDB().then(() => {
    console.log("MongoDB connected successfully");
}).catch((err) => {
    console.log("MongoDB connection failed !!! ", err);
})