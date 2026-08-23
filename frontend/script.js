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

            // Suggestions Phase
            showStatus('Generating creative suggestions...', '');
            textInput.placeholder = 'Generating creative suggestions...';

            const audioSuggestionsSection = document.getElementById('audioSuggestionsSection');
            const audioMoodBadge = document.getElementById('audioMoodBadge');
            const audioSuggestionsList = document.getElementById('audioSuggestionsList');
            const timeTwitter = document.getElementById('timeTwitter');
            const timeLinkedIn = document.getElementById('timeLinkedIn');
            const timeInstagram = document.getElementById('timeInstagram');
            const hashtagsTwitter = document.getElementById('hashtagsTwitter');
            const hashtagsLinkedIn = document.getElementById('hashtagsLinkedIn');
            const hashtagsInstagram = document.getElementById('hashtagsInstagram');

            let suggestResult = null;
            if (classifyResult) {
                try {
                    const suggestResponse = await fetch('/api/suggest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            text: extractResult.text,
                            classification: classifyResult
                        })
                    });

                    if (suggestResponse.ok) {
                        suggestResult = await suggestResponse.json();
                    } else {
                        console.warn('Suggest API error:', await suggestResponse.json());
                    }
                } catch (err) {
                    console.warn('Network error during suggestions:', err);
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
                
                scoreValue.innerHTML = `${scoreResult.score}/100`;
                
                // Clear any existing predicted text
                const existingPredicted = document.getElementById('predictedScoreText');
                if (existingPredicted) existingPredicted.remove();

                if (scoreResult.predicted_score && scoreResult.predicted_score > scoreResult.score && scoreResult.suggested_edits && scoreResult.suggested_edits.length > 0) {
                    const diff = scoreResult.predicted_score - scoreResult.score;
                    const predictedMsg = document.createElement('div');
                    predictedMsg.id = 'predictedScoreText';
                    predictedMsg.className = 'predicted-score-text';
                    predictedMsg.textContent = `If all changes are applied it would boost your score by ${diff}, and the final score would be ${scoreResult.predicted_score}.`;
                    document.querySelector('.score-bar-container').insertAdjacentElement('afterend', predictedMsg);
                }
                
                scoreGrammar.textContent = scoreResult.breakdown.grammar;
                scoreClarity.textContent = scoreResult.breakdown.clarity;
                scoreEngagement.textContent = scoreResult.breakdown.engagement_potential;
                scoreTone.textContent = scoreResult.breakdown.tone_fit;
                qualityScoreSection.classList.remove('hidden');

                editsContainer.innerHTML = '';
                if (scoreResult.suggested_edits && scoreResult.suggested_edits.length > 0) {
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
                } else {
                    const perfectMsg = document.createElement('div');
                    perfectMsg.style.padding = '1rem';
                    perfectMsg.style.color = '#10b981';
                    perfectMsg.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                    perfectMsg.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                    perfectMsg.style.borderRadius = '8px';
                    perfectMsg.style.fontWeight = '500';
                    perfectMsg.style.fontSize = '0.85rem';
                    perfectMsg.style.display = 'flex';
                    perfectMsg.style.alignItems = 'center';
                    perfectMsg.style.gap = '0.5rem';
                    perfectMsg.innerHTML = 'Everything is perfect! No changes required.';
                    editsContainer.appendChild(perfectMsg);
                }
                suggestedEditsSection.classList.remove('hidden');
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

            if (suggestResult) {
                // Populate hashtags
                const renderHashtags = (container, tags) => {
                    container.innerHTML = '';
                    if (tags && tags.length > 0) {
                        tags.forEach(tag => {
                            const span = document.createElement('span');
                            span.className = 'hashtag-pill';
                            span.textContent = tag;
                            container.appendChild(span);
                        });
                    }
                };

                renderHashtags(hashtagsTwitter, suggestResult.hashtags?.twitter);
                renderHashtags(hashtagsLinkedIn, suggestResult.hashtags?.linkedin);
                renderHashtags(hashtagsInstagram, suggestResult.hashtags?.instagram);

                const renderTime = (el, data, defaultTime, defaultReason) => {
                    const time = data?.time || defaultTime;
                    const reason = data?.reason || defaultReason;
                    el.innerHTML = `<span class="time-text">${time}</span><span class="tooltip-text">${reason}</span>`;
                };

                renderTime(timeTwitter, suggestResult.best_time_to_post?.twitter, 'Weekdays, 9am - 11am', 'Standard active hours on X.');
                renderTime(timeLinkedIn, suggestResult.best_time_to_post?.linkedin, 'Tue-Thu, 9am - 12pm', 'Professional peak networking hours.');
                renderTime(timeInstagram, suggestResult.best_time_to_post?.instagram, 'Weekdays, 6pm - 9pm', 'Casual browsing time after work.');

                // Populate Audio
                audioMoodBadge.textContent = suggestResult.audio_mood || 'unknown';
                audioSuggestionsList.innerHTML = '';
                if (suggestResult.audio_suggestions && suggestResult.audio_suggestions.length > 0) {
                    suggestResult.audio_suggestions.forEach(suggestion => {
                        const li = document.createElement('li');
                        li.textContent = suggestion;
                        audioSuggestionsList.appendChild(li);
                    });
                }
                audioSuggestionsSection.classList.remove('hidden');
            } else {
                timeTwitter.innerHTML = '';
                timeLinkedIn.innerHTML = '';
                timeInstagram.innerHTML = '';
                hashtagsTwitter.innerHTML = '';
                hashtagsLinkedIn.innerHTML = '';
                hashtagsInstagram.innerHTML = '';
                audioSuggestionsSection.classList.add('hidden');
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
