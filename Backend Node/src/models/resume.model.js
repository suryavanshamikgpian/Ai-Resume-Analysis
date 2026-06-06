const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "User ID is required"]
    },
    originalName: {
        type: String,
        required: [true, "Original file name is required"]
    },
    parsedText: {
        type: String,
        required: [true, "Parsed text is required"]
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const resumeModel = mongoose.model("resumes", ResumeSchema);
module.exports = resumeModel;
