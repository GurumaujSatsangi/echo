const { callOpenAI } = require('../services/openaiService');
const fs = require('fs');
const path = require('path');

const audioMoodMap = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/audioMoodMap.json'), 'utf8')
);

const systemPrompt = `You are a creative social media strategist.
Your job is to read the provided text and context, and suggest:
1. 3-5 platform-specific hashtags for Twitter, LinkedIn, and Instagram.
2. A single primary audio mood for the content.

You MUST choose the audio_mood from one of these exact strings:
- "upbeat/energetic"
- "calm/reflective"
- "corporate/minimal"
- "dramatic/cinematic"
- "playful/fun"

You must return a valid JSON object strictly adhering to the following structure:
{
  "hashtags": {
    "twitter": ["#hashtag1", "#hashtag2"],
    "linkedin": ["#hashtag1", "#hashtag2"],
    "instagram": ["#hashtag1", "#hashtag2"]
  },
  "best_time_to_post": {
    "twitter": { "time": "e.g., Tuesday, 9:00 AM", "reason": "brief reason why" },
    "linkedin": { "time": "e.g., Wednesday, 10:00 AM", "reason": "brief reason why" },
    "instagram": { "time": "e.g., Friday, 6:00 PM", "reason": "brief reason why" }
  },
  "audio_mood": "string"
}

CRITICAL RULES:
- Only return JSON, no markdown formatting.
- Ensure the audio_mood perfectly matches one of the allowed strings.
`;

const suggestContent = async (req, res, next) => {
    try {
        const { text, classification } = req.body;

        if (!text || typeof text !== 'string') {
            const err = new Error('Text is required for suggestions.');
            err.status = 400;
            return next(err);
        }

        const userPrompt = `Context Category: ${classification?.category || 'unknown'}
Context Tone: ${classification?.tone || 'unknown'}

Here is the source text:
${text}`;

        try {
            const result = await callOpenAI(systemPrompt, userPrompt, { jsonMode: true });

            // Validate shape
            if (!result.hashtags || !result.audio_mood) {
                const err = new Error('AI returned a malformed response missing required suggestion fields.');
                err.status = 502;
                return next(err);
            }

            // Map the audio mood to actual audio suggestions
            let audio_suggestions = audioMoodMap[result.audio_mood];
            
            // Fallback if the model hallucinates an invalid mood string
            if (!audio_suggestions) {
                audio_suggestions = audioMoodMap["default"];
            }

            // Append the audio suggestions to the result object
            result.audio_suggestions = audio_suggestions;

            res.json(result);
        } catch (aiError) {
            aiError.status = aiError.status || 502;
            return next(aiError);
        }

    } catch (error) {
        error.status = 500;
        error.message = 'Internal server error during suggestions.';
        return next(error);
    }
};

module.exports = {
    suggestContent
};
