const { PDFDocument } = PDFLib;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const fileListSection = document.getElementById('file-list-section');
const mergeBtn = document.getElementById('merge-btn');
const clearBtn = document.getElementById('clear-btn');
const mergeLoader = document.getElementById('merge-loader');
const mergeBtnText = document.getElementById('merge-btn-text');
const statusMessage = document.getElementById('status-message');

let uploadedFiles = [];

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

clearBtn.addEventListener('click', clearAll);

mergeBtn.addEventListener('click', mergePDFs);

// Handlers
function handleFiles(files) {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0 && files.length > 0) {
        showStatus('Please upload PDF files only.', 'error');
        return;
    }

    uploadedFiles = [...uploadedFiles, ...pdfFiles];
    updateUI();
}

function updateUI() {
    fileList.innerHTML = '';
    
    if (uploadedFiles.length > 0) {
        fileListSection.style.display = 'block';
        mergeBtn.disabled = uploadedFiles.length < 2;
        
        uploadedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.draggable = true;
            fileItem.dataset.index = index;
            
            fileItem.innerHTML = `
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
                        <span class="file-size">${formatBytes(file.size)}</span>
                    </div>
                </div>
                <button class="remove-btn" onclick="removeFile(${index})" title="Remove">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;

            // Drag and Drop Events
            fileItem.addEventListener('dragstart', handleDragStart);
            fileItem.addEventListener('dragover', handleDragOver);
            fileItem.addEventListener('drop', handleDrop);
            fileItem.addEventListener('dragend', handleDragEnd);
            fileItem.addEventListener('dragenter', handleDragEnter);

            fileList.appendChild(fileItem);
        });
    } else {
        fileListSection.style.display = 'none';
        mergeBtn.disabled = true;
    }
}

function moveFile(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < uploadedFiles.length) {
        const temp = uploadedFiles[index];
        uploadedFiles[index] = uploadedFiles[newIndex];
        uploadedFiles[newIndex] = temp;
        updateUI();
    }
}

// Drag and Drop Logic
let draggedItemIndex = null;

function handleDragStart(e) {
    draggedItemIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    this.classList.add('drag-over-item');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    const items = document.querySelectorAll('.file-item');
    items.forEach(item => item.classList.remove('drag-over-item'));
}

function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(this.dataset.index);
    if (draggedItemIndex !== null && draggedItemIndex !== targetIndex) {
        const itemToMove = uploadedFiles.splice(draggedItemIndex, 1)[0];
        uploadedFiles.splice(targetIndex, 0, itemToMove);
        updateUI();
    }
    draggedItemIndex = null;
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateUI();
}

function clearAll() {
    uploadedFiles = [];
    updateUI();
    showStatus('', '');
}

async function mergePDFs() {
    if (uploadedFiles.length < 2) return;

    setLoading(true);
    showStatus('Merging PDFs...', 'info');

    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of uploadedFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        download(mergedPdfBytes, "merged_document.pdf", "application/pdf");
        
        showStatus('Merge successful! Your download should start automatically.', 'success');
    } catch (error) {
        console.error('Merge failed:', error);
        showStatus('An error occurred while merging. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

// Helpers
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showStatus(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = 'status-message status-' + type;
}

function setLoading(isLoading) {
    mergeBtn.disabled = isLoading;
    mergeLoader.style.display = isLoading ? 'block' : 'none';
    mergeBtnText.textContent = isLoading ? 'Merging...' : 'Merge & Download';
}

function download(data, filename, type) {
    const file = new Blob([data], { type: type });
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

// Expose to global
window.removeFile = removeFile;
window.moveFile = moveFile;
