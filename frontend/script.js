document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeBtn = document.getElementById('removeBtn');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    const textInput = document.getElementById('textInput');

    let currentFile = null;

    // Trigger file input on click
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    // Drag and drop events on document body
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        document.body.addEventListener(eventName, (e) => {
            // Only show dropzone if dragging a file
            if (e.dataTransfer.types.includes('Files')) {
                dropZone.classList.remove('hidden');
            }
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, (e) => {
            // Hide dropzone if leaving window or dropping
            if (e.type === 'drop' || (e.relatedTarget === null && e.type === 'dragleave')) {
                dropZone.classList.add('hidden');
            }
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.add('hidden');
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
        
        fileInfo.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.querySelector('svg').style.stroke = 'var(--bg-main)';
        statusMessage.textContent = '';
        textInput.placeholder = 'Ready to analyze...';
    }

    removeBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.querySelector('svg').style.stroke = 'currentColor';
        statusMessage.textContent = '';
        textInput.placeholder = 'Upload a document for analysis...';
    });

    submitBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        submitBtn.disabled = true;
        textInput.placeholder = 'Uploading...';
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
            textInput.placeholder = 'Upload complete.';
        } catch (error) {
            console.error('Error:', error);
            showStatus(error.message, 'error');
            submitBtn.disabled = false;
            textInput.placeholder = 'Ready to analyze...';
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
