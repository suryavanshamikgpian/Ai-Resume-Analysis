const { Router } = require("express");
const authController = require("../controller/auth.controller");
const authMiddleware = require("../middleware/auth.middleware")

const authRouter = Router();

authRouter.post("/register", authController.registerUser);
authRouter.post("/login", authController.loginUser);
authRouter.get("/logout", authController.logoutUser);
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController);

module.exports = authRouter; 