const { z } = require("zod");
const { groq } = require("../config/groq");

// Zod schema that mirrors the expected AI output
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

async function analyzeResumeAndJD(resumeText, jobDescription) {
    const prompt = `You are an expert career coach and resume analyst.

Analyze the following RESUME against the JOB DESCRIPTION and return a JSON object with exactly this structure:
{
  "matchScore": <number 0-100 indicating how well the resume matches the job>,
  "skillsFound": [<list of skills from the resume that match the job description>],
  "skillsGap": [<list of skills required by the job but missing from the resume>],
  "interviewQuestions": [
    { "question": "<a likely interview question based on the job and resume>", "category": "<Technical | Behavioral | Situational>" }
  ],
  "summary": "<a 3-4 sentence overall assessment of the candidate's fit>"
}

Rules:
- matchScore must be an integer between 0 and 100.
- skillsFound and skillsGap must each have at least 1 item.
- Provide exactly 5 interview questions.
- Return ONLY valid JSON, no markdown, no explanation.

--- RESUME ---
${resumeText}

--- JOB DESCRIPTION ---
${jobDescription}
`;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Free, ultra-fast LLaMA 3
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
    });

    const responseText = completion.choices[0].message.content;

    // Parse the JSON string OpenAI returns
    const parsed = JSON.parse(responseText);

    // Validate with Zod — throws if shape is wrong
    const validated = AnalysisSchema.parse(parsed);

    return validated;
}

module.exports = { analyzeResumeAndJD, AnalysisSchema };
