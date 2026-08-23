const { callOpenAI } = require('../services/openaiService');

const systemPrompt = `You are an expert social media content classifier.
Your job is to analyze the user's provided text and categorize it.

You must return a valid JSON object strictly adhering to the following structure:
{
  "category": "...", // strictly one of: advertisement, greeting, announcement, product_launch, personal_update, event_promotion, other
  "tone": "...", // a single descriptive word (e.g., enthusiastic, formal, joyful, urgent, neutral)
  "summary": "..." // a concise, one-line summary of the text content
}`;

const classifyText = async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            const err = new Error('Text is required for classification.');
            err.status = 400;
            return next(err);
        }

        // We only analyze up to a certain length to prevent massive token usage if necessary,
        // but for now we'll pass the full text as user prompt.
        const userPrompt = `Here is the text to analyze:\n\n${text}`;

        try {
            const result = await callOpenAI(systemPrompt, userPrompt, { jsonMode: true });

            // Validate shape
            if (!result.category || !result.tone || !result.summary) {
                const err = new Error('AI returned a malformed response missing required fields.');
                err.status = 502;
                return next(err);
            }

            res.json(result);
        } catch (aiError) {
            // This catches parsing errors or upstream OpenAI errors
            aiError.status = aiError.status || 502;
            return next(aiError);
        }

    } catch (error) {
        error.status = 500;
        error.message = 'Internal server error during classification.';
        return next(error);
    }
};

module.exports = {
    classifyText
};
