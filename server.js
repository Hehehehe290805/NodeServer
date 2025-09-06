const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const app = express();

// ✅ Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Upload Directory Setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ✅ Allowed file types
const allowedTypes = ['jpeg', 'png', 'gif', 'jpg', 'pdf', 'txt'];

// ✅ Multer storage and filter
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext); // filename without extension
        cb(null, `${base}-${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext.slice(1))) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed'), false);
    }
};

const upload = multer({ storage, fileFilter });

// ✅ Handle file upload
app.post('/upload', upload.single('myFile'), (req, res) => {
    res.json({ success: true, filename: req.file.filename });
});

// ✅ List uploaded files with details
app.get('/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json({ error: "Error reading uploads folder" });

        const fileData = files.map(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(2) + " KB";
            const type = mime.lookup(file) || "unknown";
            return { name: file, size, type };
        });

        res.json(fileData);
    });
});

// ✅ Serve uploaded files for preview/download
app.get('/files/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("File not found");
    }
});

// ✅ Handle file deletion
app.post('/delete/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).json({ error: 'Upload error: ' + err.message });
    } else if (err) {
        res.status(400).json({ error: err.message });
    } else {
        next();
    }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
