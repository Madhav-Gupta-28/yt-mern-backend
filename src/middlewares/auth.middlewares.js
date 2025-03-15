import jwt from "jsonwebtoken";
import {User} from "../models/user.models.js";
import {ApiError} from "../utils/apiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async(req,res,next) => {

  try {
      const accessToken = req.cookies.accessToken || req.headers("Authorization").replace("Bearer ","");
  
      if(!accessToken){
          throw new ApiError(401 , "Please login to access this resource");
      }
  
      const decoded = jwt.verify(accessToken , process.env.ACCESS_TOKEN_SECRET);
  
      if(!decoded){
          throw new ApiError(401 , "Invalid access token");
      }
  
      const user = await User.findById(decoded._id);
  
      if(!user){
          throw new ApiError(401 , "User not found");
      }
  
      req.user = user;
      next();
      
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
    
  }
})

























