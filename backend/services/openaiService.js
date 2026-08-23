const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Strips markdown code fences from a string if present.
 */
function cleanJsonOutput(text) {
    if (typeof text !== 'string') return text;
    // Remove markdown code blocks if the model wrapped it
    return text.replace(/^```json/im, '').replace(/```$/m, '').trim();
}

/**
 * Call OpenAI API with a system and user prompt, and optional retry logic.
 *
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {object} options 
 * @returns {Promise<any>}
 */
async function callOpenAI(systemPrompt, userPrompt, options = {}) {
    const { jsonMode = false, retries = 1 } = options;

    let attempt = 0;
    while (attempt <= retries) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini', // Assuming a default capable model
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                // When jsonMode is true, enforce JSON format
                ...(jsonMode && { response_format: { type: 'json_object' } })
            });

            const content = completion.choices[0].message.content;

            if (jsonMode) {
                const cleanedContent = cleanJsonOutput(content);
                try {
                    return JSON.parse(cleanedContent);
                } catch (parseError) {
                    throw new Error(`Failed to parse OpenAI JSON response. Raw output: ${content}`);
                }
            }

            return content;
        } catch (error) {
            attempt++;
            const isTransientError = 
                error.status === 429 || 
                (error.status >= 500 && error.status < 600);
                
            if (!isTransientError || attempt > retries) {
                console.error(`OpenAI API Error after ${attempt} attempts:`, error.message);
                throw error;
            }
            console.warn(`OpenAI call failed (attempt ${attempt}). Retrying...`);
            // Optional: short delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

module.exports = { callOpenAI };
