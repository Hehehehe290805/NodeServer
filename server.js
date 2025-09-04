const http = require('http');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const app = express();

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
            return;
        } else {
            res.writeHead(200, { 'Content-Type': mime.lookup(filePath) });
            res.end(content, 'utf8');
        }        
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const allowedTypes = ['jpeg', 'png', 'gif', 'jpg', 'pdf', 'txt'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
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

app.get('/upload', (req, res) => {
    res.send(`
        <h2>File Upload</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="myFile" />
            <button type="submit">Upload</button>
        </form>
    `);
});

app.post('/upload', upload.single('myFile'), (req, res) => {
    res.send(`File uploaded successfully. File name: ${req.file.filename}`);
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).send('Upload error: ' + err.message);
    } else if (err) {
        res.status(400).send('Error: ' + err.message);
    } else {
        next();
    }
});
