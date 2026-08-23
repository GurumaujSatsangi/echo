document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeBtn = document.getElementById('removeBtn');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');

    let currentFile = null;

    // Trigger file input on click
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Also trigger on drop zone click
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Basic validation
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            showStatus('Invalid file type. Please upload a PDF, PNG, or JPEG.', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showStatus('File is too large. Max size is 10MB.', 'error');
            return;
        }

        currentFile = file;
        fileName.textContent = file.name;
        
        dropZone.classList.add('hidden');
        fileInfo.classList.remove('hidden');
        submitBtn.classList.remove('hidden');
        statusMessage.textContent = '';
    }

    removeBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        submitBtn.classList.add('hidden');
        statusMessage.textContent = '';
    });

    submitBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
        showStatus('Uploading...', '');

        const formData = new FormData();
        formData.append('document', currentFile);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            showStatus('File uploaded successfully!', 'success');
            console.log('Upload success:', result);
            
            // For now, keep the file info visible but disable submit
            submitBtn.textContent = 'Uploaded';
        } catch (error) {
            console.error('Error:', error);
            showStatus(error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload & Analyze';
        }
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message';
        if (type === 'error') {
            statusMessage.classList.add('status-error');
        } else if (type === 'success') {
            statusMessage.classList.add('status-success');
        }
    }
});
