import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const userSchema = new mongoose.Schema({

    username : {
        type : String , 
        required : true , 
        unique : true , 
        minlength : 3 , 
        maxlength : 20
    } , 

    fullName : {
        type : String , 
        required : true , 
        trim : true , 
 
    } , 
    email : {
        type : String , 
        required : true , 
        unique : true , 
        } , 

    password : {
        type : String , 
        required : [true , "Password is required"] , 
        minlength : 8 , 
        maxlength : 25,
        lowercase : true,
        unique : true
    } , 

    avatar : {
        type : String , 
        required : true , 
        default : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    } ,

    coverImage : {
        type : String , 
        required : true , 
        default : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
    } ,
    
    watchHistory : [{
        type : [mongoose.Schema.Types.ObjectId] , 
        ref : "Video"
    }] , 

    likedVideos : [ {
        type : [mongoose.Schema.Types.ObjectId] , 
        ref : "Video"
    } ],  

    refreshToken : {
        type : String , 
    } , 

}, {timestamps : true})

userSchema.pre("save",async function(next){

    if(!this.isModified("password")){
        return next()
    }

    this.password = await bcrypt.hash(this.password , 10 )

})

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({_id : this._id , email : this.email} , process.env.ACCESS_TOKEN_SECRET , {expiresIn : "15h"})
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({_id : this._id} , process.env.REFRESH_TOKEN_SECRET , {expiresIn : "15d"})
}



userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)
}



export const User = mongoose.model("User",userSchema)