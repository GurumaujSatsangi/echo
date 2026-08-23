document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeBtn = document.getElementById('removeBtn');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    const statusContainer = document.getElementById('statusContainer');
    const textInput = document.getElementById('textInput');
    
    // New UI Elements
    const errorBanner = document.getElementById('errorBanner');
    const errorMessage = document.getElementById('errorMessage');
    const dismissErrorBtn = document.getElementById('dismissErrorBtn');
    const centerGreeting = document.getElementById('centerGreeting');
    const resultPanel = document.getElementById('resultPanel');
    const resultMeta = document.getElementById('resultMeta');
    const startOverBtn = document.getElementById('startOverBtn');
    const extractedText = document.getElementById('extractedText');
    const inputWrapper = document.getElementById('inputWrapper');

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
            if (e.dataTransfer.types.includes('Files')) {
                dropZone.classList.remove('hidden');
            }
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, (e) => {
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
        
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            showErrorBanner('Invalid file type. Please upload a PDF, PNG, or JPEG.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showErrorBanner('File is too large. Max size is 10MB.');
            return;
        }

        currentFile = file;
        fileName.textContent = file.name;
        
        fileInfo.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.querySelector('svg').style.stroke = 'var(--bg-main)';
        showStatus('', '');
        errorBanner.classList.add('hidden');
        textInput.placeholder = 'Ready to analyze...';
    }

    removeBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.querySelector('svg').style.stroke = 'currentColor';
        showStatus('', '');
        textInput.placeholder = 'Upload a document for analysis...';
    });

    submitBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        submitBtn.disabled = true;
        errorBanner.classList.add('hidden');
        textInput.placeholder = 'Uploading...';
        showStatus('Uploading...', '');

        const formData = new FormData();
        formData.append('document', currentFile);

        try {
            // Upload phase
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(uploadResult.error || 'Upload failed');
            }

            // Extraction phase
            showStatus('Extracting text...', '');
            textInput.placeholder = 'Extracting text...';
            
            const extractResponse = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: uploadResult.fileId,
                    mimeType: uploadResult.mimeType
                })
            });

            const extractResult = await extractResponse.json();

            if (!extractResponse.ok) {
                throw new Error(extractResult.error || 'Extraction failed');
            }

            // Success phase
            showStatus('', '');
            inputWrapper.classList.add('hidden');
            centerGreeting.classList.add('hidden');
            resultPanel.classList.remove('hidden');
            
            extractedText.value = extractResult.text || 'No text extracted.';
            if (extractResult.confidence) {
                resultMeta.textContent = `Confidence: ${extractResult.confidence}%`;
            } else if (extractResult.pageCount) {
                resultMeta.textContent = `Pages: ${extractResult.pageCount}`;
            } else {
                resultMeta.textContent = '';
            }

        } catch (error) {
            console.error('Error:', error);
            showErrorBanner(error.message);
            showStatus('', '');
            submitBtn.disabled = false;
            textInput.placeholder = 'Ready to analyze...';
        }
    });

    function showStatus(message, type) {
        if (message) {
            statusContainer.classList.remove('hidden');
            statusMessage.textContent = message;
            statusMessage.className = 'status-message';
            if (type === 'error') {
                statusMessage.classList.add('status-error');
            } else if (type === 'success') {
                statusMessage.classList.add('status-success');
            }
        } else {
            statusContainer.classList.add('hidden');
        }
    }

    function showErrorBanner(message) {
        errorMessage.textContent = message;
        errorBanner.classList.remove('hidden');
    }

    dismissErrorBtn.addEventListener('click', () => {
        errorBanner.classList.add('hidden');
    });

    startOverBtn.addEventListener('click', () => {
        resultPanel.classList.add('hidden');
        centerGreeting.classList.remove('hidden');
        inputWrapper.classList.remove('hidden');
        removeBtn.click(); // Resets file input and submit button state
    });
});
