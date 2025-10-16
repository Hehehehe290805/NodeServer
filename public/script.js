// ---------------- DOM Elements ----------------
const uploadForm = document.getElementById('uploadForm');
const uploadStatus = document.getElementById('uploadStatus');
const filesTableBody = document.querySelector('#filesTable tbody');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const selectAll = document.getElementById('selectAll');
const progressWrapper = document.getElementById('progressWrapper');
const progressBar = document.getElementById('progressBar');
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");
const popupButtons = document.getElementById("popupButtons");
const catFactBtn = document.getElementById("catFactBtn");
const catFactDisplay = document.getElementById("catFactDisplay");

// ---------------- Popup Helpers ----------------
function showPopup(message, buttons = [{ text: "OK", class: "btn-confirm", action: () => hidePopup() }]) {
    popupMessage.textContent = message;
    popupButtons.innerHTML = "";
    buttons.forEach(btn => {
        const button = document.createElement("button");
        button.textContent = btn.text;
        button.className = btn.class;
        button.onclick = () => btn.action();
        popupButtons.appendChild(button);
    });
    popup.style.display = "flex";
}
function hidePopup() { popup.style.display = "none"; }

// ---------------- Upload Files with Progress ----------------
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload", true);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            progressWrapper.style.display = "block";
            progressBar.style.width = percent + "%";
            progressBar.textContent = percent + "%";
        }
    };

    xhr.onload = () => {
        progressWrapper.style.display = "none";
        progressBar.style.width = "0%";
        progressBar.textContent = "0%";
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
                uploadStatus.textContent = `✅ Uploaded ${data.files.length} file(s) successfully!`;
                loadFiles();
            } else showPopup("❌ Upload failed: " + data.error);
        } else showPopup("❌ Error uploading file.");
    };

    xhr.send(formData);
});

// ---------------- Load Files ----------------
async function loadFiles() {
    const res = await fetch('/files');
    const files = await res.json();
    filesTableBody.innerHTML = '';

    files.forEach(file => {
        const row = document.createElement('tr');
        let previewContent;
        if (file.type.startsWith("image/")) {
            previewContent = `<a href="/files/${file.name}" target="_blank"><img class="thumb" src="/files/${file.name}" alt="${file.name}"></a>`;
        } else {
            previewContent = `<a class="preview-link" href="/files/${file.name}" target="_blank">View</a>`;
        }

        row.innerHTML = `
      <td><input type="checkbox" class="fileCheckbox" value="${file.name}"></td>
      <td>${file.name}</td>
      <td>${file.size}</td>
      <td>${file.type}</td>
      <td>${previewContent}</td>
      <td><button onclick="deleteFile('${file.name}')">Delete</button></td>
    `;
        filesTableBody.appendChild(row);
    });

    selectAll.checked = false;
}

// ---------------- Delete Single File ----------------
async function deleteFile(filename) {
    showPopup(`Are you sure you want to delete ${filename}?`, [
        { text: "Cancel", class: "btn-cancel", action: hidePopup },
        {
            text: "Delete", class: "btn-confirm", action: async () => {
                hidePopup();
                const res = await fetch('/delete/' + filename, { method: 'POST' });
                const data = await res.json();
                if (data.success) loadFiles();
                else showPopup("❌ Error deleting file: " + data.error);
            }
        }
    ]);
}

// ---------------- Bulk Delete ----------------
deleteSelectedBtn.addEventListener('click', async () => {
    const selected = Array.from(document.querySelectorAll('.fileCheckbox:checked')).map(cb => cb.value);
    if (!selected.length) { showPopup("⚠️ No files selected"); return; }

    showPopup(`Are you sure you want to delete ${selected.length} file(s)?`, [
        { text: "Cancel", class: "btn-cancel", action: hidePopup },
        {
            text: "Delete", class: "btn-confirm", action: async () => {
                hidePopup();
                const res = await fetch('/delete-many', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ files: selected })
                });
                const data = await res.json();
                if (data.success) loadFiles();
                else showPopup("❌ Error deleting files: " + data.error);
            }
        }
    ]);
});

// ---------------- Master Checkbox ----------------
selectAll.addEventListener('change', () => {
    document.querySelectorAll('.fileCheckbox').forEach(cb => cb.checked = selectAll.checked);
});

// ---------------- Cat Facts ----------------
catFactBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('/catfact');
        const data = await res.json();
        if (data.success) catFactDisplay.textContent = data.fact;
        else catFactDisplay.textContent = "❌ Failed to fetch cat fact";
    } catch (err) {
        catFactDisplay.textContent = "❌ Error fetching cat fact";
    }
});

// ---------------- Initial Load ----------------
loadFiles();
