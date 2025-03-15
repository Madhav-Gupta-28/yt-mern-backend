import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";


const errorHandler = (err , req , res , next) => {

    let error  = err;
    
    if(!(error instanceof ApiError)){
        const statusCode = error.statusCode || (error instanceof mongoose.Error ? 500 : res.statusCode);
        const message = error.message || "Something Went Wrong";
        error = new ApiError(statusCode , message , error?.errors || [], error.stack);
    }

    return res.status(error.statusCode).json(
        new APIResponse(error.statusCode, null, error.message)
    );
    
}

export {errorHandler}