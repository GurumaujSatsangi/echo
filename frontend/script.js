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

            // Classification Phase
            showStatus('Analyzing content...', '');
            textInput.placeholder = 'Analyzing content...';

            const overviewCard = document.getElementById('contentOverviewCard');
            const categoryBadge = document.getElementById('categoryBadge');
            const toneBadge = document.getElementById('toneBadge');
            const summaryText = document.getElementById('summaryText');

            let classifyResult = null;
            try {
                const classifyResponse = await fetch('/api/classify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: extractResult.text })
                });

                if (classifyResponse.ok) {
                    classifyResult = await classifyResponse.json();
                } else {
                    const errObj = await classifyResponse.json();
                    console.warn('Classification API error:', errObj);
                }
            } catch (err) {
                console.warn('Network error during classification:', err);
            }

            // Scoring Phase
            showStatus('Scoring content quality...', '');
            textInput.placeholder = 'Scoring content quality...';
            
            const qualityScoreSection = document.getElementById('qualityScoreSection');
            const suggestedEditsSection = document.getElementById('suggestedEditsSection');
            const scoreValue = document.getElementById('scoreValue');
            const scoreBarFill = document.getElementById('scoreBarFill');
            const editsContainer = document.getElementById('editsContainer');
            
            const scoreGrammar = document.getElementById('scoreGrammar');
            const scoreClarity = document.getElementById('scoreClarity');
            const scoreEngagement = document.getElementById('scoreEngagement');
            const scoreTone = document.getElementById('scoreTone');

            let scoreResult = null;
            if (classifyResult) {
                try {
                    const scoreResponse = await fetch('/api/score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            text: extractResult.text,
                            classification: classifyResult
                        })
                    });

                    if (scoreResponse.ok) {
                        scoreResult = await scoreResponse.json();
                    } else {
                        console.warn('Scoring API error:', await scoreResponse.json());
                    }
                } catch (err) {
                    console.warn('Network error during scoring:', err);
                }
            }

            // Rewrites Phase
            showStatus('Generating platform rewrites...', '');
            textInput.placeholder = 'Generating platform rewrites...';

            const platformRewritesSection = document.getElementById('platformRewritesSection');
            const textTwitter = document.getElementById('textTwitter');
            const textLinkedIn = document.getElementById('textLinkedIn');
            const textInstagram = document.getElementById('textInstagram');

            let rewriteResult = null;
            if (classifyResult) {
                try {
                    const rewriteResponse = await fetch('/api/rewrite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            text: extractResult.text,
                            classification: classifyResult
                        })
                    });

                    if (rewriteResponse.ok) {
                        rewriteResult = await rewriteResponse.json();
                    } else {
                        console.warn('Rewrite API error:', await rewriteResponse.json());
                    }
                } catch (err) {
                    console.warn('Network error during rewriting:', err);
                }
            }

            // Success phase
            showStatus('', '');
            inputWrapper.classList.add('hidden');
            centerGreeting.classList.add('hidden');
            resultPanel.classList.remove('hidden');

            if (classifyResult) {
                categoryBadge.textContent = classifyResult.category.replace('_', ' ');
                toneBadge.textContent = classifyResult.tone;
                summaryText.textContent = classifyResult.summary;
                overviewCard.classList.remove('hidden');
            } else {
                overviewCard.classList.add('hidden');
            }
            
            if (scoreResult) {
                scoreValue.textContent = `${scoreResult.score}/100`;
                // slight delay for animation
                setTimeout(() => {
                    scoreBarFill.style.width = `${scoreResult.score}%`;
                }, 100);
                
                scoreGrammar.textContent = scoreResult.breakdown.grammar;
                scoreClarity.textContent = scoreResult.breakdown.clarity;
                scoreEngagement.textContent = scoreResult.breakdown.engagement_potential;
                scoreTone.textContent = scoreResult.breakdown.tone_fit;
                qualityScoreSection.classList.remove('hidden');

                if (scoreResult.suggested_edits && scoreResult.suggested_edits.length > 0) {
                    editsContainer.innerHTML = '';
                    scoreResult.suggested_edits.forEach(edit => {
                        const card = document.createElement('div');
                        card.className = 'edit-card';
                        card.innerHTML = `
                            <div class="edit-reason">${edit.reason}</div>
                            <div class="edit-diff">
                                <div class="edit-original">- ${edit.original.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                                <div class="edit-suggested">+ ${edit.suggested.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                            </div>
                        `;
                        editsContainer.appendChild(card);
                    });
                    suggestedEditsSection.classList.remove('hidden');
                } else {
                    suggestedEditsSection.classList.add('hidden');
                }
            } else {
                qualityScoreSection.classList.add('hidden');
                suggestedEditsSection.classList.add('hidden');
                scoreBarFill.style.width = '0%';
            }

            if (rewriteResult) {
                textTwitter.value = rewriteResult.twitter || '';
                textLinkedIn.value = rewriteResult.linkedin || '';
                textInstagram.value = rewriteResult.instagram || '';
                platformRewritesSection.classList.remove('hidden');
            } else {
                platformRewritesSection.classList.add('hidden');
            }
            
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

    // Tab Switching Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const container = e.target.closest('.tabs-container');
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Copy to Clipboard Logic
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const targetId = e.target.getAttribute('data-copy');
            const textToCopy = document.getElementById(targetId).value;
            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalText = e.target.textContent;
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                e.target.textContent = 'Failed';
                setTimeout(() => {
                    e.target.textContent = 'Copy to Clipboard';
                }, 2000);
            }
        });
    });
});
