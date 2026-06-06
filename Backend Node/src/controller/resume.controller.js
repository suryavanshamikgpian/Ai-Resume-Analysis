const resumeModel = require("../models/resume.model");
const pdfParse = require("pdf-parse");
const multer = require("multer");

// multer memory storage — keeps file in RAM buffer, no disk writes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"), false);
        }
    }
});

async function uploadResume(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No PDF file uploaded" });
        }

        // extract raw text from the PDF buffer
        const pdfData = await pdfParse(req.file.buffer);

        if (!pdfData.text || pdfData.text.trim().length === 0) {
            return res.status(400).json({ message: "Could not extract text from the PDF" });
        }

        const resume = await resumeModel.create({
            userId: req.user.id,
            originalName: req.file.originalname,
            parsedText: pdfData.text
        });

        return res.status(201).json({
            message: "Resume uploaded successfully",
            resume
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getUserResumes(req, res) {
    try {
        const resumes = await resumeModel
            .find({ userId: req.user.id })
            .sort({ uploadedAt: -1 })
            .select("-parsedText"); // don't send the big text blob to the client
        return res.status(200).json({ resumes });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { upload, uploadResume, getUserResumes };
