// Serve static files (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, 'public')));

// API: upload
app.post('/upload', upload.single('myFile'), (req, res) => {
    res.json({ success: true, filename: req.file.filename });
});

// API: list files
app.get('/files/list', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json({ error: "Error reading uploads folder" });

        const list = files.map(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(2) + " KB";
            const type = mime.lookup(file) || "unknown";
            return { file, size, type };
        });
        res.json(list);
    });
});

// API: serve uploaded files
app.get('/files/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("File not found");
    }
});

// API: delete
app.post('/delete/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "File not found" });
    }
});
