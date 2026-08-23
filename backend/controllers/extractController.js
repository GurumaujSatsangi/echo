const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');

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
    let worker = null;
    try {
        worker = await createWorker('eng');
        
        const recognizePromise = worker.recognize(filePath);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 30000)
        );

        const result = await Promise.race([recognizePromise, timeoutPromise]);
        
        await worker.terminate();

        return {
            text: result.data.text,
            confidence: result.data.confidence
        };
    } catch (error) {
        if (worker) {
            await worker.terminate().catch(() => {});
        }
        if (error.message === 'TIMEOUT') {
            const err = new Error('Image extraction timed out (30s). The image might be too complex or unclear.');
            err.status = 504;
            throw err;
        }
        console.error("OCR error:", error);
        throw new Error('Failed to extract text from image. It may be unsupported or corrupted.');
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
