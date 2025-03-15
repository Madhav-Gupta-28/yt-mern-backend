import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";
import { APIResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary , deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.js";


const registerUser = asyncHandler(async(req,res) => {

    if (!req.body) {
        throw new ApiError(400 , "Body is required");
    }

    const {username , fullName  , email , password } = req.body;

    // validate the user input
    if ([fullName , username , email , password].some(field => field.trim() === "" )){
        throw new ApiError(400 , "All fields are required fullname , username , email");
    }

    // check if the user already exists
    const existingUser = await User.findOne({$or : [{username} , {email}]});
    if(existingUser){
        throw new ApiError(400 , "User already exists");
    }


    const avatarImage = req.files?.avatar[0]?.path;
    const coverImage = req.files?.cover[0]?.path;

    if(!avatarImage || !coverImage){
        throw new ApiError(400 , "All fields are required avatar and cover before uploading");
    }
    let avatar;
    let cover;
    // upload the avatar and cover to cloudinary
    try{
        avatar = await uploadOnCloudinary(avatarImage);
        
    }catch(error){
        throw new ApiError(500 , "Internal server error Someting Went Wrong When Uploading Avatar ");
    }

    try{
         cover = await uploadOnCloudinary(coverImage);
    }catch(error){
        throw new ApiError(500 , "Internal server error Someting Went Wrong When Uploading  Cover");
    }

    if(!avatar || !cover){
        throw new ApiError(400 , "All fields are required avatar and cover");
    }
    
    const user = await User.create({username , fullName , email , password , avatar : avatar.url , coverImage : cover.url});

    // const createdUser = await user.findById(user._id).select("-password -refreshToken");

    // if(!createdUser){
    //     throw new ApiError(500 , "Internal server error Someting Went Wrong When Registring User");
    // }
    
    return res.status(200).json(new APIResponse(200 ,user ,"User created successfully" ))
})

export {registerUser}