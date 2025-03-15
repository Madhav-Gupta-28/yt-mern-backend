import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const healthcheck = asyncHandler(async(req,res) => {
    return res.status(200).json(new APIResponse(200,"OK" , {message: "Server is running"}));
})

export {healthcheck};

