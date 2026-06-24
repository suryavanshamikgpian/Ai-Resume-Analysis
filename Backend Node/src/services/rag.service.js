/**
 * RAG Service — Retrieval-Augmented Generation Pipeline
 *
 * Flow: Resume Text → Chunk → Embed (local Xenova) → Vector Store → Similarity Search → Top-K Retrieval
 *
 * Uses local HuggingFace embeddings (Xenova/all-MiniLM-L6-v2) — NO external API key needed.
 */

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

// ── Singleton: Xenova embedding pipeline ──
let embedder = null;

async function getEmbedder() {
    if (!embedder) {
        // Dynamic import because @xenova/transformers is ESM-only
        const { pipeline } = await import("@xenova/transformers");
        console.log("⏳ Loading embedding model (first run downloads ~30 MB)...");
        embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        console.log("✅ Embedding model loaded successfully");
    }
    return embedder;
}

/**
 * Generate a normalized embedding vector for a given text.
 * Uses Xenova/all-MiniLM-L6-v2 (384-dimensional vectors).
 */
async function generateEmbedding(text) {
    const model = await getEmbedder();
    const output = await model(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Split resume text into chunks using LangChain's RecursiveCharacterTextSplitter.
 * Chunk size: 500 chars, overlap: 50 chars.
 */
async function splitIntoChunks(text) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50,
    });
    return await splitter.splitText(text);
}

/**
 * Full RAG retrieval pipeline:
 * 1. Split resume into chunks
 * 2. Embed each chunk (local Xenova model)
 * 3. Embed the job description
 * 4. Compute cosine similarity between JD and each chunk
 * 5. Return top-K most relevant chunks
 *
 * @param {string} resumeText  — Parsed resume text
 * @param {string} jobDescription — Job description to match against
 * @param {number} topK — Number of top chunks to retrieve (default: 5)
 * @returns {Array<{content: string, score: number}>} — Ranked relevant chunks
 */
async function retrieveRelevantChunks(resumeText, jobDescription, topK = 5) {
    // Step 1: Split resume into chunks
    const chunks = await splitIntoChunks(resumeText);
    console.log(`📄 Split resume into ${chunks.length} chunks`);

    // Step 2: Embed all resume chunks
    const chunkEmbeddings = [];
    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);
        chunkEmbeddings.push(embedding);
    }
    console.log(`🔢 Generated ${chunkEmbeddings.length} chunk embeddings`);

    // Step 3: Embed the job description
    const jdEmbedding = await generateEmbedding(jobDescription);

    // Step 4: Score chunks by cosine similarity
    const scoredChunks = chunks.map((chunk, index) => ({
        content: chunk,
        score: cosineSimilarity(chunkEmbeddings[index], jdEmbedding),
    }));

    // Step 5: Sort by relevance and return top-K
    scoredChunks.sort((a, b) => b.score - a.score);

    const topChunks = scoredChunks.slice(0, Math.min(topK, scoredChunks.length));
    console.log(`🎯 Retrieved top ${topChunks.length} chunks (scores: ${topChunks.map(c => (c.score * 100).toFixed(1) + "%").join(", ")})`);

    return topChunks;
}

/**
 * Warmup: Pre-load the embedding model at server startup.
 * Call this in server.js to avoid cold-start delay on first analysis.
 */
async function warmupEmbeddings() {
    try {
        await getEmbedder();
    } catch (error) {
        console.error("⚠️  Failed to warmup embedding model:", error.message);
    }
}

module.exports = { retrieveRelevantChunks, generateEmbedding, splitIntoChunks, warmupEmbeddings };
