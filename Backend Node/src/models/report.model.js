const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "User ID is required"]
    },
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "resumes",
        required: [true, "Resume ID is required"]
    },
    jobDescription: {
        type: String,
        required: [true, "Job description is required"]
    },
    analysis: {
        matchScore: { type: Number, required: true },
        skillsFound: [{ type: String }],
        skillsGap: [{ type: String }],
        interviewQuestions: [{
            question: { type: String },
            category: { type: String }
        }],
        summary: { type: String, required: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const reportModel = mongoose.model("reports", ReportSchema);
module.exports = reportModel;
