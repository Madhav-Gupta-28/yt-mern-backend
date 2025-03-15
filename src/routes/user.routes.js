import { Router } from "express";
import { registerUser , loginUser , refreshAccessToken , logoutUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const userRouter = Router();

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
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/logout").post(verifyJWT , logoutUser);

export default userRouter;
