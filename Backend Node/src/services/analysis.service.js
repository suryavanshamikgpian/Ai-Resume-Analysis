/**
 * Analysis Service — LangChain + Groq LLM with RAG Pipeline
 *
 * Flow: RAG Retrieval → LangChain PromptTemplate → ChatGroq (LLaMA 3.3-70B) → Zod Validation
 */

const { z } = require("zod");
const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { retrieveRelevantChunks } = require("./rag.service");

// ── Zod schema for validated AI output ──
const AnalysisSchema = z.object({
    matchScore: z.number().min(0).max(100),
    skillsFound: z.array(z.string()),
    skillsGap: z.array(z.string()),
    interviewQuestions: z.array(
        z.object({
            question: z.string(),
            category: z.string(),
        })
    ),
    summary: z.string(),
});

// ── LangChain Prompt Template ──
// Note: Double curly braces {{ }} escape literal braces in LangChain templates
const ANALYSIS_TEMPLATE = `You are an expert career coach and resume analyst.

Analyze the following RELEVANT RESUME SECTIONS (retrieved via semantic similarity search) against the JOB DESCRIPTION and return a JSON object with exactly this structure:
{{
  "matchScore": <number 0-100 indicating how well the resume matches the job>,
  "skillsFound": [<list of skills from the resume that match the job description>],
  "skillsGap": [<list of skills required by the job but missing from the resume>],
  "interviewQuestions": [
    {{ "question": "<a likely interview question based on the job and resume>", "category": "<Technical | Behavioral | Situational>" }}
  ],
  "summary": "<a 3-4 sentence overall assessment of the candidate's fit>"
}}

Rules:
- matchScore must be an integer between 0 and 100.
- skillsFound and skillsGap must each have at least 1 item.
- Provide exactly 5 interview questions.
- Return ONLY valid JSON, no markdown, no explanation.

--- RELEVANT RESUME SECTIONS (retrieved via RAG pipeline) ---
{context}

--- JOB DESCRIPTION ---
{jobDescription}`;

/**
 * RAG-powered resume analysis using LangChain and Groq.
 *
 * Pipeline:
 * 1. RAG Retrieval — retrieve top-K relevant resume chunks via embeddings + cosine similarity
 * 2. Prompt Construction — inject retrieved context into LangChain ChatPromptTemplate
 * 3. LLM Inference — send to Groq LLaMA 3.3-70B via LangChain ChatGroq
 * 4. Validation — parse JSON response and validate with Zod schema
 */
async function analyzeResumeAndJD(resumeText, jobDescription) {
    // ── Step 1: RAG — Retrieve relevant resume chunks ──
    const relevantChunks = await retrieveRelevantChunks(resumeText, jobDescription, 5);

    const context = relevantChunks
        .map((chunk, i) =>
            `[Chunk ${i + 1} | Relevance: ${(chunk.score * 100).toFixed(1)}%]\n${chunk.content}`
        )
        .join("\n\n");

    console.log(`🧠 RAG context prepared: ${context.length} chars from ${relevantChunks.length} chunks`);

    // ── Step 2: LangChain Prompt + ChatGroq LLM ──
    const llm = new ChatGroq({
        model: "llama-3.3-70b-versatile",
        apiKey: process.env.GROQ_API_KEY,
        temperature: 0.4,
    });

    // Bind response_format to enforce JSON output from Groq
    const jsonLlm = llm.withStructuredOutput(z.object({
        matchScore: z.number().min(0).max(100),
        skillsFound: z.array(z.string()),
        skillsGap: z.array(z.string()),
        interviewQuestions: z.array(
            z.object({
                question: z.string(),
                category: z.string(),
            })
        ),
        summary: z.string(),
    }), { name: "analysis_result" });

    const prompt = ChatPromptTemplate.fromTemplate(ANALYSIS_TEMPLATE);

    // LangChain chain: Prompt → LLM
    const chain = prompt.pipe(jsonLlm);

    // ── Step 3: Invoke the chain ──
    const response = await chain.invoke({
        context,
        jobDescription,
    });

    console.log("⚡ LLM response received from Groq via LangChain");

    // ── Step 4: Validate with Zod ──
    // withStructuredOutput already returns a parsed object matching the schema
    const validated = AnalysisSchema.parse(response);

    return validated;
}

module.exports = { analyzeResumeAndJD, AnalysisSchema };
