const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { callOpenAIVision } = require('../services/openaiService');

async function extractFromPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return {
            text: data.text,
            pageCount: data.numpages
        };
    } catch (error) {
        console.error("PDF Parse error:", error);
        throw new Error('Failed to parse PDF. It may be corrupted or unreadable.');
    }
}

async function extractFromImage(filePath) {
    try {
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        
        const systemPrompt = `You are a highly accurate Optical Character Recognition (OCR) system. 
Your task is to extract all the text visible in the provided image exactly as it appears. 
Do not add any descriptions, summaries, or Markdown formatting. 
Return ONLY the raw extracted text.`;
        const userPrompt = `Please extract all the text from this image.`;
        
        const text = await callOpenAIVision(systemPrompt, userPrompt, base64Image);
        
        return {
            text: text,
            confidence: 90 // Approximating high confidence for vision model
        };
    } catch (error) {
        console.error("OpenAI Vision OCR error:", error);
        throw new Error('Failed to extract text from image using Vision API.');
    }
}

const extractText = async (req, res, next) => {
    try {
        const { filePath, mimeType } = req.body;

        if (!filePath || !mimeType) {
            const err = new Error('filePath and mimeType are required.');
            err.status = 400;
            return next(err);
        }

        // For security, ensure the filePath doesn't try to access outside the uploads dir
        const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(__dirname, '..', 'uploads', path.basename(normalizedPath));

        if (!fs.existsSync(fullPath)) {
            const err = new Error('File not found.');
            err.status = 404;
            return next(err);
        }

        try {
            if (mimeType === 'application/pdf') {
                const result = await extractFromPdf(fullPath);
                return res.json(result);
            } else if (mimeType.startsWith('image/')) {
                const result = await extractFromImage(fullPath);
                return res.json(result);
            } else {
                const err = new Error('Unsupported file type for extraction.');
                err.status = 400;
                return next(err);
            }
        } catch (error) {
            error.status = error.status || 422;
            return next(error);
        }
    } catch (error) {
        error.status = 500;
        error.message = 'Internal server error during extraction.';
        return next(error);
    }
};

module.exports = {
    extractText,
    extractFromPdf,
    extractFromImage
};
