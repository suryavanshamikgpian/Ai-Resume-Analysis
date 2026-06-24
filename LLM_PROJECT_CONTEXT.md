# AI Resume Analyzer - Project Context Document

This document serves as a comprehensive reference for the AI Resume Analyzer project. It is intended to be used as a context file for any Large Language Model (LLM) assisting with future development, debugging, or scaling of the application.

## 1. Project Overview
The AI Resume Analyzer is a full-stack platform designed to automate the process of screening resumes against job descriptions. It leverages an advanced Retrieval-Augmented Generation (RAG) pipeline to parse, chunk, embed, and semantically analyze candidate profiles, returning actionable ATS (Applicant Tracking System) metrics, skill gaps, and custom interview questions.

## 2. Tech Stack
- **Frontend:** React, Vite, Cookie-based session management.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (via Mongoose).
- **AI & RAG Pipeline:** LangChain, Hugging Face local embeddings (`@xenova/transformers` with `all-MiniLM-L6-v2`), Groq Cloud (LLaMA 3.3-70B Versatile).
- **Data Validation:** Zod.
- **Authentication:** JWT, bcrypt.
- **File Processing:** Multer (Memory Storage), pdf-parse.

## 3. System Architecture & Flow

### A. Authentication Flow
- **Registration/Login:** Handled via custom auth controllers. Passwords are encrypted with bcrypt.
- **Session:** JWT tokens are issued and stored in HTTP-only cookies on the frontend.
- **Security:** Token blacklisting is implemented for logout to ensure JWTs cannot be reused.

### B. Resume Upload & Processing Flow
1. **Upload:** User uploads a PDF resume and pastes a Job Description (JD) text via the React frontend.
2. **Multer:** Backend intercepts the file, storing it temporarily in memory (capped at 5MB).
3. **pdf-parse:** Extracts raw text from the PDF buffer.
4. **RAG Pipeline Trigger:** The raw resume text and JD text are passed to the Analysis Service.

### C. RAG & Agentic AI Pipeline (Core Logic)
1. **Semantic Chunking:** 
   - Uses `RecursiveCharacterTextSplitter` from LangChain.
   - Chunks the resume text into 500-character segments with a 50-character overlap.
2. **Local Vector Embeddings:**
   - Uses `@xenova/transformers` to generate 384-dimensional vectors locally using the `Xenova/all-MiniLM-L6-v2` model. This results in zero external API costs for embeddings.
   - The embedding model is pre-warmed at server startup.
3. **Vector Search (Cosine Similarity):**
   - The Job Description is embedded.
   - Cosine similarity is calculated between the JD embedding and all resume chunk embeddings.
   - The top-5 most relevant chunks are retrieved.
4. **LLM Invocation:**
   - A LangChain `ChatPromptTemplate` is constructed using the top-5 chunks as `{context}` and the `{jobDescription}`.
   - The prompt is piped into `ChatGroq` using the `llama-3.3-70b-versatile` model.
   - The model is forced to output JSON using LangChain's `.withStructuredOutput()` bound to a Zod schema.
5. **Schema Validation:**
   - The Zod schema strictly enforces the output format, guaranteeing 100% data integrity.
   - **Expected Outputs:** `matchScore` (number 0-100), `skillsFound` (array of strings), `skillsGap` (array of strings), `interviewQuestions` (array of objects with `question` and `category`), `summary` (string).

### D. Persistence
- The validated JSON analysis report is saved to MongoDB, linked to the User's ID.
- The report can be fetched later via the dashboard.

## 4. Key Directories & Files
- `/Frontend React/`: Contains the Vite + React Single Page Application (SPA).
- `/Backend Node/`: Contains the Express server.
  - `server.js`: Application entry point. Connects to MongoDB and warms up the embedding model.
  - `src/controllers/`: Route handlers for authentication, uploads, and fetching reports.
  - `src/services/rag.service.js`: Handles LangChain text splitting, local Xenova vector embeddings, and cosine similarity calculation logic.
  - `src/services/analysis.service.js`: Handles LangChain `ChatGroq` instantiation, structured Zod output binding, and final prompt execution.
  - `src/models/`: Mongoose schemas (User, Report, Blacklisted Token).
  - `src/middlewares/`: Auth verification and Multer setup.

## 5. Environment Variables Map
```env
PORT=3000
NODE_ENV=development
MONGO_URI=<mongodb_connection_string>
JWT_SECRET=<secret_key>
GROQ_API_KEY=<groq_api_key_for_llama3>
```
*(Note: OpenAI is not used. Embeddings are handled entirely locally via Hugging Face models).*

## 6. Important Notes for AI/LLM Assistants
If modifying this project in the future, adhere to the following architectural rules:
1. **RAG over Direct Prompting:** Do not revert to sending the entire resume text directly to the LLM. Always pass the text through the `retrieveRelevantChunks` function in `rag.service.js` first.
2. **Local Embeddings:** We use `@xenova/transformers` for embeddings. Avoid introducing external API dependencies for embeddings (e.g., OpenAI) unless explicitly requested by the user.
3. **Structured Outputs Issue:** When using LangChain with Groq, always use `llm.withStructuredOutput(ZodSchema)`. Do NOT use `llm.bind({ response_format: { type: "json_object" } })` as it causes `llm.bind is not a function` errors due to recent package version updates.
