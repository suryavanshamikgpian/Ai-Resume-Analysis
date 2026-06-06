const { Router } = require("express");
const resumeController = require("../controller/resume.controller");
const authMiddleware = require("../middleware/auth.middleware");

const resumeRouter = Router();

// POST /upload — auth-protected, single PDF file field named "resume"
resumeRouter.post(
    "/upload",
    authMiddleware.authUser,
    resumeController.upload.single("resume"),
    resumeController.uploadResume
);

// GET /user — fetch all resumes for the logged-in user
resumeRouter.get(
    "/user",
    authMiddleware.authUser,
    resumeController.getUserResumes
);

module.exports = resumeRouter;
