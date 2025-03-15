import express from "express";
import cors from "cors";
import  healthcheckRouter from "./routes/healthcheck.routes.js";
const app = express();


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

export  {app} ;