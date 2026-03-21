const { PDFDocument } = PDFLib;

// DOM Elements
const dropZone       = document.getElementById('drop-zone');
const fileInput      = document.getElementById('file-input');
const fileList       = document.getElementById('file-list');
const fileListSection= document.getElementById('file-list-section');
const mergeBtn       = document.getElementById('merge-btn');
const mergeBtnText   = document.getElementById('merge-btn-text');
const clearBtn       = document.getElementById('clear-btn');
const statusMessage  = document.getElementById('status-message');
const themeToggle    = document.getElementById('theme-toggle');
const themeIcon      = document.getElementById('theme-icon');
const filenameInput  = document.getElementById('filename-input');
const summaryFiles   = document.getElementById('summary-files');
const summaryPages   = document.getElementById('summary-pages');
const summarySize    = document.getElementById('summary-size');
const progressWrap   = document.getElementById('progress-wrap');
const progressLabel  = document.getElementById('progress-label');
const progressPct    = document.getElementById('progress-pct');
const progressFill   = document.getElementById('progress-fill');

let uploadedFiles = [];   // [{ file: File, pages: number|null }]

// ── THEME TOGGLE ─────────────────────────────────────────────────────
function applyTheme(light) {
    if (light) {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '☀';
        localStorage.setItem('theme', 'dark');
    }
}

// Sync icon with current theme on load
applyTheme(document.documentElement.getAttribute('data-theme') === 'light');

themeToggle.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') !== 'light');
});

// ── DROP ZONE ─────────────────────────────────────────────────────────
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
clearBtn.addEventListener('click', clearAll);
mergeBtn.addEventListener('click', mergePDFs);

// ── FILE HANDLING ─────────────────────────────────────────────────────
function handleFiles(files) {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');

    if (pdfFiles.length === 0 && files.length > 0) {
        showStatus('Please upload PDF files only.', 'error');
        return;
    }

    const newEntries = pdfFiles.map(f => ({ file: f, pages: null }));
    uploadedFiles = [...uploadedFiles, ...newEntries];
    updateUI();

    // Read page counts in background
    newEntries.forEach(entry => {
        entry.file.arrayBuffer().then(buf => PDFDocument.load(buf)).then(pdf => {
            entry.pages = pdf.getPageCount();
            updateUI();
        }).catch(() => { entry.pages = '?'; updateUI(); });
    });
}

// ── UI UPDATE ─────────────────────────────────────────────────────────
function updateUI() {
    fileList.innerHTML = '';

    if (uploadedFiles.length > 0) {
        fileListSection.style.display = 'block';
        mergeBtn.disabled = uploadedFiles.length < 2;

        uploadedFiles.forEach(({ file, pages }, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.draggable = true;
            item.dataset.index = index;

            const pagesBadge = pages != null
                ? `<span class="pages-badge">${pages} ${pages === 1 ? 'page' : 'pages'}</span>`
                : `<span class="pages-badge" style="opacity:0.4">…</span>`;

            item.innerHTML = `
                <div class="file-main-info">
                    <div class="reorder-btns">
                        <button class="reorder-btn" onclick="moveFile(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Move Up">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        </button>
                        <button class="reorder-btn" onclick="moveFile(${index}, 1)" ${index === uploadedFiles.length - 1 ? 'disabled' : ''} title="Move Down">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </div>
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <div class="file-meta">
                            <span class="file-size">${formatBytes(file.size)}</span>
                            ${pagesBadge}
                        </div>
                    </div>
                </div>
                <button class="remove-btn" onclick="removeFile(${index})" title="Remove">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;

            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover',  handleDragOver);
            item.addEventListener('drop',      handleDrop);
            item.addEventListener('dragend',   handleDragEnd);
            item.addEventListener('dragenter', handleDragEnter);

            fileList.appendChild(item);
        });

        updateSummary();
    } else {
        fileListSection.style.display = 'none';
        mergeBtn.disabled = true;
    }
}

// ── SUMMARY BAR ───────────────────────────────────────────────────────
function updateSummary() {
    const totalSize  = uploadedFiles.reduce((s, e) => s + e.file.size, 0);
    const knownPages = uploadedFiles.filter(e => typeof e.pages === 'number');
    const totalPages = knownPages.reduce((s, e) => s + e.pages, 0);
    const pagesText  = knownPages.length < uploadedFiles.length
        ? `${totalPages}+ pages`
        : `${totalPages} ${totalPages === 1 ? 'page' : 'pages'}`;

    summaryFiles.textContent = `${uploadedFiles.length} ${uploadedFiles.length === 1 ? 'file' : 'files'}`;
    summaryPages.textContent = pagesText;
    summarySize.textContent  = formatBytes(totalSize);
}

// ── REORDER & REMOVE ─────────────────────────────────────────────────
function moveFile(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < uploadedFiles.length) {
        [uploadedFiles[index], uploadedFiles[newIndex]] = [uploadedFiles[newIndex], uploadedFiles[index]];
        updateUI();
    }
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateUI();
    showStatus('', '');
}

function clearAll() {
    uploadedFiles = [];
    updateUI();
    showStatus('', '');
    setProgress(false);
}

// ── DRAG-TO-REORDER ───────────────────────────────────────────────────
let draggedItemIndex = null;

function handleDragStart(e) {
    draggedItemIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}
function handleDragOver(e)  { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function handleDragEnter()  { this.classList.add('drag-over-item'); }
function handleDragEnd()    {
    this.classList.remove('dragging');
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('drag-over-item'));
}
function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(this.dataset.index);
    if (draggedItemIndex !== null && draggedItemIndex !== targetIndex) {
        const [moved] = uploadedFiles.splice(draggedItemIndex, 1);
        uploadedFiles.splice(targetIndex, 0, moved);
        updateUI();
    }
    draggedItemIndex = null;
}

// ── MERGE ─────────────────────────────────────────────────────────────
async function mergePDFs() {
    if (uploadedFiles.length < 2) return;

    setLoading(true);
    setProgress(true, 0, `Merging 0 of ${uploadedFiles.length} files…`);
    showStatus('', '');

    try {
        const mergedPdf = await PDFDocument.create();

        for (let i = 0; i < uploadedFiles.length; i++) {
            const { file } = uploadedFiles[i];
            setProgress(true, i / uploadedFiles.length, `Merging file ${i + 1} of ${uploadedFiles.length}…`);

            const buf  = await file.arrayBuffer();
            const pdf  = await PDFDocument.load(buf);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(p => mergedPdf.addPage(p));
        }

        setProgress(true, 1, 'Saving…');
        const bytes    = await mergedPdf.save();
        const filename = (filenameInput.value.trim() || 'merged_document') + '.pdf';
        download(bytes, filename, 'application/pdf');

        setProgress(false);
        showStatus('✓ Merge successful! Your download should start automatically.', 'success');
    } catch (err) {
        console.error('Merge failed:', err);
        setProgress(false);
        showStatus('An error occurred while merging. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

// ── HELPERS ───────────────────────────────────────────────────────────
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, dm = Math.max(0, decimals);
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showStatus(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = 'status-message' + (type ? ` status-${type}` : '');
}

function setLoading(on) {
    mergeBtn.disabled   = on;
    mergeBtnText.textContent = on ? 'Merging…' : 'Merge & Download';
}

function setProgress(visible, ratio = 0, label = '') {
    progressWrap.style.display = visible ? 'block' : 'none';
    if (visible) {
        const pct = Math.round(ratio * 100);
        progressFill.style.width  = pct + '%';
        progressPct.textContent   = pct + '%';
        progressLabel.textContent = label;
    }
}

function download(data, filename, type) {
    const blob = new Blob([data], { type });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}

// Expose to global (used in inline onclick handlers)
window.removeFile = removeFile;
window.moveFile   = moveFile;
