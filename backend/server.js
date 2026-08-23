require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPEG are allowed.'));
    }
  }
});

const uploadMiddleware = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      err.status = 400;
      return next(err);
    } else if (err) {
      err.status = 400;
      return next(err);
    }
    next();
  });
};

app.post('/api/upload', uploadMiddleware, (req, res, next) => {
  if (!req.file) {
    const err = new Error('No file uploaded.');
    err.status = 400;
    return next(err);
  }

  res.json({
    fileId: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    path: req.file.path
  });
});

const { extractText } = require('./controllers/extractController');
app.post('/api/extract', extractText);

const { classifyText } = require('./controllers/classifyController');
app.post('/api/classify', classifyText);

const { scoreText } = require('./controllers/scoreController');
app.post('/api/score', scoreText);

const { rewriteText } = require('./controllers/rewriteController');
app.post('/api/rewrite', rewriteText);

app.get('/api/health', (req, res) => {
  res.json({ status: "ok" });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Centralized Error Handling:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
