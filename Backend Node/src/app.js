const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth.routes');
const resumeRouter = require('./routes/resume.routes');
const reportRouter = require('./routes/report.routes');
const cookieParser = require('cookie-parser');
const app = express();

// middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// using all the routes here below
app.use("/api/auth", authRouter);

app.use("/api/resume", resumeRouter);
app.use("/api/report", reportRouter);




module.exports = app;