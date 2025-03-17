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


const refreshAccessToken = asyncHandler(async(req,res) => {

    const {refreshToken} = req.cookies.refreshToken || req.body.refreshToken;

    if(!refreshToken){
        throw new ApiError(401 , "Refresh token is required");
    }

    // verify the refresh token
   try {
     const decodedToken = jwt.verify(refreshToken , process.env.REFRESH_TOKEN_SECRET);
 
    if(!decodedToken){
         throw new ApiError(401 , "Invalid refresh token");
    }

    const user = await User.findById(decodedToken?.id);

    if(!user){
        throw new ApiError(401 , "User not found");
    }
    

    if (user.refreshToken !== refreshToken){
        throw new ApiError(401 , "Invalid refresh token");
    }

    const options = {
        httpOnly : true,
        secure : process.env.NODE_ENV !== "production",
    }

    const {accessToken , refreshToken:newRefreshToken} = await generateAccessTokenandRefreshToken(user._id);

    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , newRefreshToken , options)
    .json(new APIResponse(200 , {accessToken , refreshToken : newRefreshToken} , "Access token refreshed successfully"));



   } catch (error) {
    throw new ApiError(500 , "Something went wrong while refreshing the access token");
   }
    
})
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


const logoutUser = asyncHandler(async(req,res) => {

    await User.findByIdAndUpdate(req.user._id , {refreshToken : null});

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json(new APIResponse(200 , null , "User logged out successfully"));
})


const changePassword = asyncHandler(async(req,res) => {

    const {oldPassword , newPassword} = req.body;

    if(!oldPassword || !newPassword){
        throw new ApiError(400 , "All fields are required old password and new password");
    }

    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(404 , "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res.status(200).json(new APIResponse(200 , null , "Password changed successfully"));
})


const getCurrentUser = asyncHandler(async(req,res) => {
    return res.status(200).json(new APIResponse(200 , req.user , "Current user fetched successfully"));
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName , email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400 , "All fields are required full name and email");
    }

    const user = await User.findByIdAndUpdate(req.user?._id , {$set : {fullName , email}} , {new : true});

    if(!user){
        throw new ApiError(404 , "User not found");
    }

    await user.save({validateBeforeSave : false});

    return res.status(200).json(new APIResponse(200 , user , "Account details updated successfully"));
    
    

})

const updatecoverImage = asyncHandler(async(req,res) => {
    const coverImage = req.files?.path;

    if(!coverImage){
        throw new ApiError(400 , "Cover image is required");
    }

    const cover = await uploadOnCloudinary(coverImage);

    if(!cover){
        throw new ApiError(400 , "Cover image is required");
    }

    const user = await User.findByIdAndUpdate(req.user?._id , {$set : {coverImage : cover.url}} , {new : true});

    if(!user){
        throw new ApiError(404 , "User not found");
    }

    return res.status(200).json(new APIResponse(200 , user , "Cover image updated successfully"));
    
})

const updateAvatarImage = asyncHandler(async(req,res) => {
    const avatarImage = req.files?.path;

    if(!avatarImage){
        throw new ApiError(400 , "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarImage);

    if(!avatar){
        throw new ApiError(400 , "Avatar image is required");
    }

    const user = await User.findByIdAndUpdate(req.user?._id , {$set : {avatar : avatar.url}} , {new : true});

    if(!user){
        throw new ApiError(404 , "User not found");
    }

    return res.status(200).json(new APIResponse(200 , user , "Avatar image updated successfully"));
})


const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params;

    if(!username){
        throw new ApiError(400 , "Username is required");
    }

    const channel = await User.aggregate(
        [
            {
                $match : {
                    username : username?.toLowerCase()
                }
            } , {
                $lookup:{
                    from : 'subscriptions' ,
                    localField : '_id' ,
                    foreignField : 'channel' ,
                    as : 'subscribers'
                } , 
                $lookup : {
                    from :"subscriptions" ,
                    localField : '_id' ,
                    foreignField : 'subscriber' ,
                    as : 'subscriptedTo'
                } , 
                $addFields : {
                    subscriberCount : {
                        $size : '$subscribers'
                    } , 
                    channelsubscribedtoCount : {
                        $size : '$subscriptedTo'
                        
                },

                isSubscribed : {
                    $cond : {
                        if : {
                            $in : [req.user?._id , '$subscribers.subscriber']
                        } , 
                        then : true ,
                        else : false
                    }
                }
            } ,

            {
                $project :{
                    fullName : 1 ,
                    username : 1 ,
                    avatar : 1 ,
                    coverImage : 1 ,
                    subscriberCount : 1 ,
                    channelsubscribedtoCount : 1 ,
                    isSubscribed : 1 ,
                }
            }
        ]
    )

    if(!channel){
        throw new ApiError(404 , "Channel not found");
    }

    return res.status(200).json(new APIResponse(200 , channel[0] , "Channel profile fetched successfully"));
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = User.aggregate([
        {
            $match :{
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },{
            $lookup : {
                from : 'videos' ,
                localField : 'watchHistory' ,
                foreignField : '_id' ,
                as : 'watchHistory'
            }
        } , {
            $unwind : '$watchHistory'
        } , {
            $project : {
                watchHistory : {
                    _id : '$watchHistory._id' ,
                    title : '$watchHistory.title' ,
                    thumbnail : '$watchHistory.thumbnail' ,
                    duration : '$watchHistory.duration' ,
                    
                }
            }
        }
    ])

    if(!user){
        throw new ApiError(404 , "User not found");
    }

    return res.status(200).json(new APIResponse(200 , user[0] , "Watch history fetched successfully"));
})


export {registerUser , generateAccessTokenandRefreshToken , loginUser , refreshAccessToken , logoutUser , changePassword , getCurrentUser}