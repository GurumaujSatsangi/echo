const { callOpenAI } = require('../services/openaiService');

const systemPrompt = `You are an expert ATS-style content quality scorer and copy editor.
Your job is to evaluate the provided text based on grammar, clarity, engagement potential, and tone fit (based on its intended category).

You must return a valid JSON object strictly adhering to the following structure:
{
  "score": 0, // an integer from 0 to 100 representing the overall quality
  "breakdown": {
    "grammar": 0, // an integer from 0 to 100
    "clarity": 0, // an integer from 0 to 100
    "engagement_potential": 0, // an integer from 0 to 100
    "tone_fit": 0 // an integer from 0 to 100
  },
  "suggested_edits": [
    {
      "original": "exact text from the original content to replace",
      "suggested": "your suggested replacement",
      "reason": "brief reason for the change"
    }
  ]
}

CRITICAL RULES:
- The "suggested_edits" array MUST contain NO MORE THAN 5 items. Focus only on the most impactful edits. If the text is perfect, return an empty array.
- "score" and all breakdown values must be integers between 0 and 100.
`;

const scoreText = async (req, res, next) => {
    try {
        const { text, classification } = req.body;

        if (!text || typeof text !== 'string') {
            const err = new Error('Text is required for scoring.');
            err.status = 400;
            return next(err);
        }

        // Pass classification context to help with tone_fit evaluation
        const userPrompt = `Content Category: ${classification?.category || 'unknown'}\nContent Tone: ${classification?.tone || 'unknown'}\n\nHere is the text to evaluate:\n\n${text}`;

        try {
            const result = await callOpenAI(systemPrompt, userPrompt, { jsonMode: true });

            // Validate shape
            if (
                typeof result.score !== 'number' ||
                !result.breakdown ||
                typeof result.breakdown.grammar !== 'number' ||
                !Array.isArray(result.suggested_edits)
            ) {
                const err = new Error('AI returned a malformed response missing required fields for scoring.');
                err.status = 502;
                return next(err);
            }

            // Enforce max 5 edits server-side just in case the AI hallucinated more
            if (result.suggested_edits.length > 5) {
                result.suggested_edits = result.suggested_edits.slice(0, 5);
            }

            res.json(result);
        } catch (aiError) {
            aiError.status = aiError.status || 502;
            return next(aiError);
        }

    } catch (error) {
        error.status = 500;
        error.message = 'Internal server error during scoring.';
        return next(error);
    }
};

module.exports = {
    scoreText
};
