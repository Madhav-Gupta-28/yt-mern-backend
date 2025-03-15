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


const generateAccessTokenandRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
    
        if(!user){
            throw new ApiError(404 , "User not found");
        }
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});
    
        return {accessToken , refreshToken};
    } catch (error) {
        throw new ApiError(500 , "Internal server error Someting Went Wrong When Generating Access Token and Refresh Token");
    }
}

const loginUser = asyncHandler(async(req,res) => {


    // get data from body
    const {username , email , password} = req.body;

    if(!username && !email || !password){
        throw new ApiError(400 , "All fields are required username or email and password");
    }

    const user = await User.findOne({$or : [{username} , {email}]});

    if(!user){
        throw new ApiError(400 , "Invalid username or email");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid password");
    }

    const {accessToken , refreshToken} = await generateAccessTokenandRefreshToken(user._id);

    const loggedInUser = await user.findById(user._id).select("-password -refreshToken");

    if(!loggedInUser){
        throw new ApiError(404 , "User not found");
    }

    loggedInUser.refreshToken = refreshToken;
    await loggedInUser.save({validateBeforeSave : false});
    
    return res.status(200)
    .cookie("accessToken" , accessToken , {httpOnly : true , secure : process.env.NODE_ENV !== "production" })
    .cookie("refreshToken" , refreshToken , {httpOnly : true , secure : process.env.NODE_ENV !== "production" })
    .json(new APIResponse(200 , {user : loggedInUser , accessToken , refreshToken} , "User logged in successfully"));

})

export {registerUser , generateAccessTokenandRefreshToken , loginUser}