const resumeModel = require("../models/resume.model");
const reportModel = require("../models/report.model");
const { analyzeResumeAndJD } = require("../services/analysis.service");

async function generateReport(req, res) {
    try {
        const { resumeId, jobDescription } = req.body;

        if (!resumeId || !jobDescription) {
            return res.status(400).json({
                message: "resumeId and jobDescription are required"
            });
        }

        // Fetch the resume and verify ownership
        const resume = await resumeModel.findById(resumeId);

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        if (resume.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to use this resume" });
        }

        // Call Groq analysis
        const analysis = await analyzeResumeAndJD(
            resume.parsedText,
            jobDescription
        );

        // Save report to MongoDB
        const report = await reportModel.create({
            userId: req.user.id,
            resumeId: resume._id,
            jobDescription,
            analysis
        });

        return res.status(201).json({
            message: "Report generated successfully",
            report
        });
    } catch (error) {
        console.log(error);

        // Surface Zod validation errors clearly
        if (error.name === "ZodError") {
            return res.status(502).json({
                message: "AI returned an invalid response format. Please try again.",
                details: error.errors
            });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getUserReports(req, res) {
    try {
        const reports = await reportModel
            .find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .populate("resumeId", "originalName uploadedAt");
        return res.status(200).json({ reports });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getReportById(req, res) {
    try {
        const report = await reportModel
            .findById(req.params.id)
            .populate("resumeId", "originalName uploadedAt");

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        if (report.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        return res.status(200).json({ report });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { generateReport, getUserReports, getReportById };
