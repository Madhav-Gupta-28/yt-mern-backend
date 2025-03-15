import express from "express";
import cors from "cors";
import  healthcheckRouter from "./routes/healthcheck.routes.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middlewares.js";

const app = express();

app.use(cookieParser());

// Common Middlewares
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}));

app.use(express.json({
    limit : "20kb",
}));

app.use(express.urlencoded({
    limit : "20kb",
    extended: true
}))

app.use(express.static("public"))

app.use("/api/v1/healthcheck", healthcheckRouter);

app.use("/api/v1/user", userRouter);

app.use(errorHandler);

export  {app} ;