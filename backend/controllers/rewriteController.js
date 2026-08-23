const { callOpenAI } = require('../services/openaiService');

const systemPrompt = `You are an expert social media manager.
Your job is to rewrite the provided text into three distinct platform-optimized posts: Twitter (X), LinkedIn, and Instagram.

You must return a valid JSON object strictly adhering to the following structure:
{
  "twitter": "string (under 280 chars, casual, punchy)",
  "linkedin": "string (professional, longer-form, minimal hashtags)",
  "instagram": "string (storytelling tone, emoji-friendly, hashtag block at end)"
}

CRITICAL RULES:
- The "twitter" string MUST be strictly under 280 characters. 
- Do not wrap the JSON in markdown formatting, just return raw JSON.
`;

const getRewriteResult = async (userPrompt) => {
    return await callOpenAI(systemPrompt, userPrompt, { jsonMode: true });
};

const rewriteText = async (req, res, next) => {
    try {
        const { text, classification } = req.body;

        if (!text || typeof text !== 'string') {
            const err = new Error('Text is required for rewriting.');
            err.status = 400;
            return next(err);
        }

        const userPrompt = `Context Category: ${classification?.category || 'unknown'}
Context Tone: ${classification?.tone || 'unknown'}

Here is the source text to rewrite:
${text}`;

        try {
            let result = await getRewriteResult(userPrompt);

            // Validate shape
            if (!result.twitter || !result.linkedin || !result.instagram) {
                const err = new Error('AI returned a malformed response missing required rewrite fields.');
                err.status = 502;
                return next(err);
            }

            // Enforce Twitter character limit. Re-prompt once if too long.
            if (result.twitter.length > 280) {
                console.warn(`Twitter rewrite exceeded 280 chars (${result.twitter.length}). Retrying...`);
                const retryPrompt = `${userPrompt}\n\nCRITICAL: Your previous twitter rewrite was ${result.twitter.length} characters. You MUST keep the twitter version UNDER 280 characters.`;
                result = await getRewriteResult(retryPrompt);
                
                // If it still fails, forcefully truncate it
                if (result.twitter.length > 280) {
                    result.twitter = result.twitter.substring(0, 277) + '...';
                }
            }

            res.json(result);
        } catch (aiError) {
            aiError.status = aiError.status || 502;
            return next(aiError);
        }

    } catch (error) {
        error.status = 500;
        error.message = 'Internal server error during rewriting.';
        return next(error);
    }
};

module.exports = {
    rewriteText
};
