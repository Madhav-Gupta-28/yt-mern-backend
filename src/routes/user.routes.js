import { Router } from "express";
import { registerUser , loginUser , refreshAccessToken , logoutUser, changePassword, getCurrentUser, updateAccountDetails, updatecoverImage, updateAvatarImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const userRouter = Router();

// Unsecured Routes
userRouter.route("/register").post( upload.fields([
    {
        name : "avatar",
        maxCount : 1
    },
    {
        name : "cover",
        maxCount : 1
    }
]) ,registerUser);

userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT , logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

// Secured Routes
userRouter.route("/change-password").post(verifyJWT, changePassword);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails);

// Image update routes
userRouter.route("/update-avatar").patch(
    verifyJWT, 
    upload.single("avatar"),
    updateAvatarImage
);
userRouter.route("/update-cover").patch(
    verifyJWT,
    upload.single("cover"),
    updatecoverImage
);

// Channel and watch history routes
userRouter.route("/c/:username").get(verifyJWT, getUserChannelProfile);
userRouter.route("/watch-history").get(verifyJWT, getWatchHistory);

export default userRouter;
