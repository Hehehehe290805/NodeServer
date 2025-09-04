const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const app = express();

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Upload Directory Setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Allowed file types
const allowedTypes = ['jpeg', 'png', 'gif', 'jpg', 'pdf', 'txt'];

// Multer storage and file filter configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext.slice(1))) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed'), false);
    }
};

const upload = multer({ storage, fileFilter });

// Upload form
app.get('/upload', (req, res) => {
    res.send(`
        <h2>File Upload</h2>
        <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" name="myFile" required />
            <button type="submit">Upload</button>
        </form>
        <p id="msg"></p>

        <script>
            const form = document.getElementById("uploadForm");
            const msg = document.getElementById("msg");

            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const formData = new FormData(form);

                try {
                    const res = await fetch("/upload", {
                        method: "POST",
                        body: formData
                    });
                    const text = await res.text();
                    alert(text); // ✅ Popup after upload
                } catch (err) {
                    alert("❌ Upload failed: " + err.message);
                }
            });
        </script>
    `);
});


// Handle file upload
app.post('/upload', upload.single('myFile'), (req, res) => {
    res.send(`✅ File uploaded successfully: ${req.file.filename}`);
});

// Error handling
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).send('Upload error: ' + err.message);
    } else if (err) {
        res.status(400).send('Error: ' + err.message);
    } else {
        next();
    }
});

// List all uploaded files with size and type
// List all uploaded files with preview
app.get('/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).send("Error reading uploads folder");

        let fileLinks = files.map(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(2) + " KB";
            const type = mime.lookup(file) || "unknown";

            let preview = "";

            if (type.startsWith("image/")) {
                preview = `<img src="/files/${file}" alt="${file}" style="max-width:100px; max-height:100px; border:1px solid #ccc;"/>`;
            } else if (type === "application/pdf") {
                preview = `📄`;
            } else if (type === "text/plain") {
                preview = `📃`;
            } else {
                preview = `📦`;
            }

            return `<li style="margin-bottom:10px;">
                        ${preview}<br/>
                        <a href="/files/${file}" download>${file}</a>
                        - ${size} (${type})
                        <form action="/delete/${file}" method="post" style="display:inline;">
                            <button type="submit">🗑 Delete</button>
                        </form>
                    </li>`;
        }).join("");

        res.send(`
            <h2>Uploaded Files</h2>
            <ul style="list-style:none; padding:0;">
                ${fileLinks || "<li>No files uploaded yet.</li>"}
            </ul>
            <a href="/upload">⬆ Upload more files</a>
        `);
    });
});



// Serve uploaded files for download
app.get('/files/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath); // triggers download
    } else {
        res.status(404).send("File not found");
    }
});

// Handle file deletion
app.post('/delete/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // delete the file
        res.redirect('/files'); // go back to file list
    } else {
        res.status(404).send("File not found");
    }
});



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});