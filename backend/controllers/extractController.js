const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

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

const extractText = async (req, res) => {
    try {
        const { filePath, mimeType } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: 'filePath is required.' });
        }

        // For security, ensure the filePath doesn't try to access outside the uploads dir
        const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path.join(__dirname, '..', 'uploads', path.basename(normalizedPath));

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found.' });
        }

        if (mimeType !== 'application/pdf') {
            return res.status(400).json({ error: 'Only PDF files are currently supported for extraction.' });
        }

        try {
            const result = await extractFromPdf(fullPath);
            return res.json(result);
        } catch (error) {
            return res.status(422).json({ error: error.message });
        }
    } catch (error) {
        console.error('Extraction error:', error);
        return res.status(500).json({ error: 'Internal server error during extraction.' });
    }
};

module.exports = {
    extractText,
    extractFromPdf
};
