require("dotenv").config();

const app = require("./src/app")
const { connectToDB } = require("./src/config/database")
const { warmupEmbeddings } = require("./src/services/rag.service")

const PORT = process.env.PORT || 3000;

connectToDB();

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT} using ${process.env.NODE_ENV || "development"}`);
    // Pre-load the embedding model so the first analysis isn't slow
    warmupEmbeddings();
})





