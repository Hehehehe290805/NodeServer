async function loadFiles() {
    const res = await fetch("/files/list");
    const files = await res.json();

    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";

    if (!files.length) {
        fileList.innerHTML = "<li>No files uploaded yet.</li>";
        return;
    }

    files.forEach(f => {
        let preview = "📦";
        if (f.type.startsWith("image/")) {
            preview = `<img src="/files/${f.file}" style="max-width:80px; max-height:80px;">`;
        } else if (f.type === "application/pdf") {
            preview = "📄";
        } else if (f.type === "text/plain") {
            preview = "📃";
        }

        const li = document.createElement("li");
        li.innerHTML = `
      ${preview}<br>
      <a href="/files/${f.file}" download>${f.file}</a> - ${f.size} (${f.type})
      <button onclick="deleteFile('${f.file}')">🗑 Delete</button>
    `;
        fileList.appendChild(li);
    });
}

async function deleteFile(filename) {
    if (!confirm(`Delete ${filename}?`)) return;
    await fetch("/delete/" + filename, { method: "POST" });
    loadFiles();
}

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const res = await fetch("/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
        alert("✅ Uploaded: " + data.filename);
        loadFiles();
    } else {
        alert("❌ Upload failed");
    }
});

// Load files on page load
loadFiles();
