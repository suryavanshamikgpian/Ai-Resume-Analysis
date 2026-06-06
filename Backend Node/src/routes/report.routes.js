const { Router } = require("express");
const reportController = require("../controller/report.controller");
const authMiddleware = require("../middleware/auth.middleware");

const reportRouter = Router();

// POST /generate — auth-protected
reportRouter.post(
    "/generate",
    authMiddleware.authUser,
    reportController.generateReport
);

// GET /user — all reports for the logged-in user
reportRouter.get(
    "/user",
    authMiddleware.authUser,
    reportController.getUserReports
);

// GET /:id — single report by ID
reportRouter.get(
    "/:id",
    authMiddleware.authUser,
    reportController.getReportById
);

module.exports = reportRouter;
