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
    const chatsList = document.getElementById('chatsList');
    const newChatBtn = document.querySelector('.new-chat-btn');
    
    const revisionBanner = document.getElementById('revisionBanner');
    const revisionTitle = document.getElementById('revisionTitle');
    const cancelRevisionBtn = document.getElementById('cancelRevisionBtn');
    
    const sidebar = document.getElementById('sidebar');
    const collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
    const expandSidebarBtn = document.getElementById('expandSidebarBtn');

    if (collapseSidebarBtn && expandSidebarBtn && sidebar) {
        collapseSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
            expandSidebarBtn.style.display = 'flex';
        });

        expandSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('collapsed');
            expandSidebarBtn.style.display = 'none';
        });
    }

    let currentFile = null;
    let analysisHistory = JSON.parse(localStorage.getItem('echo_recent_analyses') || '[]');
    let currentAnalysisId = null;
    let compareContext = null;

    function renderHistory() {
        chatsList.innerHTML = '';
        analysisHistory.forEach(analysis => {
            const div = document.createElement('div');
            div.className = 'chat-item';
            if (analysis.id === currentAnalysisId) {
                div.classList.add('active');
            }
            div.textContent = analysis.title || 'Untitled Analysis';
            div.addEventListener('click', () => loadAnalysis(analysis.id));
            chatsList.appendChild(div);
        });
    }

    function loadAnalysis(id) {
        const analysis = analysisHistory.find(a => a.id === id);
        if (!analysis) return;
        currentAnalysisId = id;
        compareContext = null;
        revisionBanner.classList.add('hidden');
        textInput.placeholder = 'Upload a document for analysis...';
        renderHistory();
        
        populateUI(analysis.data, null);
    }

    renderHistory();

    newChatBtn.addEventListener('click', () => {
        currentAnalysisId = null;
        compareContext = null;
        renderHistory();
        resultPanel.classList.add('hidden');
        centerGreeting.classList.remove('hidden');
        inputWrapper.classList.remove('hidden');
        textInput.placeholder = 'Upload a document for analysis...';
        revisionBanner.classList.add('hidden');
        if(removeBtn) removeBtn.click();
    });

    if (cancelRevisionBtn) {
        cancelRevisionBtn.addEventListener('click', () => {
            compareContext = null;
            revisionBanner.classList.add('hidden');
            textInput.placeholder = 'Upload a document for analysis...';
        });
    }

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
        textInput.placeholder = compareContext ? 'Ready to compare...' : 'Ready to analyze...';
    }

    removeBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.querySelector('svg').style.stroke = 'currentColor';
        showStatus('', '');
        textInput.placeholder = compareContext ? 'Upload a modified document for comparison...' : 'Upload a document for analysis...';
    });

    function populateUI(data, prevData) {
        const { extractResult, classifyResult, scoreResult, rewriteResult, suggestResult } = data;
        
        // Hide/Show logic from success phase
        inputWrapper.classList.add('hidden');
        centerGreeting.classList.add('hidden');
        resultPanel.classList.remove('hidden');

        if (classifyResult) {
            document.getElementById('categoryBadge').textContent = classifyResult.category.replace('_', ' ');
            document.getElementById('toneBadge').textContent = classifyResult.tone;
            document.getElementById('summaryText').textContent = classifyResult.summary;
            document.getElementById('contentOverviewCard').classList.remove('hidden');
        } else {
            document.getElementById('contentOverviewCard').classList.add('hidden');
        }
        
        if (scoreResult) {
            const scoreValue = document.getElementById('scoreValue');
            const previousScoreValue = document.getElementById('previousScoreValue');
            const scoreDiff = document.getElementById('scoreDiff');
            const scoreBarFill = document.getElementById('scoreBarFill');

            scoreValue.textContent = `${scoreResult.score}/100`;
            setTimeout(() => {
                scoreBarFill.style.width = `${scoreResult.score}%`;
            }, 100);
            
            if (prevData && prevData.scoreResult) {
                const diff = scoreResult.score - prevData.scoreResult.score;
                previousScoreValue.textContent = `${prevData.scoreResult.score}/100`;
                previousScoreValue.classList.remove('hidden');
                scoreDiff.classList.remove('hidden');
                scoreDiff.textContent = diff > 0 ? `+${diff}` : diff;
                scoreDiff.className = `score-diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`;
            } else {
                previousScoreValue.classList.add('hidden');
                scoreDiff.classList.add('hidden');
            }
            
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
            
            document.getElementById('scoreGrammar').textContent = scoreResult.breakdown.grammar;
            document.getElementById('scoreClarity').textContent = scoreResult.breakdown.clarity;
            document.getElementById('scoreEngagement').textContent = scoreResult.breakdown.engagement_potential;
            document.getElementById('scoreTone').textContent = scoreResult.breakdown.tone_fit;
            document.getElementById('qualityScoreSection').classList.remove('hidden');

            const editsContainer = document.getElementById('editsContainer');
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
            document.getElementById('suggestedEditsSection').classList.remove('hidden');
        } else {
            document.getElementById('qualityScoreSection').classList.add('hidden');
            document.getElementById('suggestedEditsSection').classList.add('hidden');
            document.getElementById('scoreBarFill').style.width = '0%';
        }

        // Rewrites
        if (rewriteResult) {
            document.getElementById('textTwitter').value = rewriteResult.twitter || '';
            document.getElementById('textLinkedIn').value = rewriteResult.linkedin || '';
            document.getElementById('textInstagram').value = rewriteResult.instagram || '';
            document.getElementById('platformRewritesSection').classList.remove('hidden');
        } else {
            document.getElementById('platformRewritesSection').classList.add('hidden');
        }

        // Suggestions
        if (suggestResult) {
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

            renderHashtags(document.getElementById('hashtagsTwitter'), suggestResult.hashtags?.twitter);
            renderHashtags(document.getElementById('hashtagsLinkedIn'), suggestResult.hashtags?.linkedin);
            renderHashtags(document.getElementById('hashtagsInstagram'), suggestResult.hashtags?.instagram);

            const renderTime = (el, tdata, defaultTime, defaultReason) => {
                const time = tdata?.time || defaultTime;
                const reason = tdata?.reason || defaultReason;
                el.innerHTML = `<span class="time-text">${time}</span><span class="tooltip-text">${reason}</span>`;
            };

            renderTime(document.getElementById('timeTwitter'), suggestResult.best_time_to_post?.twitter, 'Weekdays, 9am - 11am', 'Standard active hours on X.');
            renderTime(document.getElementById('timeLinkedIn'), suggestResult.best_time_to_post?.linkedin, 'Tue-Thu, 9am - 12pm', 'Professional peak networking hours.');
            renderTime(document.getElementById('timeInstagram'), suggestResult.best_time_to_post?.instagram, 'Weekdays, 6pm - 9pm', 'Casual browsing time after work.');

            document.getElementById('audioMoodBadge').textContent = suggestResult.audio_mood || 'unknown';
            const audioSuggestionsList = document.getElementById('audioSuggestionsList');
            audioSuggestionsList.innerHTML = '';
            if (suggestResult.audio_suggestions && suggestResult.audio_suggestions.length > 0) {
                suggestResult.audio_suggestions.forEach(suggestion => {
                    const li = document.createElement('li');
                    if (typeof suggestion === 'object' && suggestion.title && suggestion.url) {
                        const a = document.createElement('a');
                        a.href = suggestion.url;
                        a.textContent = suggestion.title;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        li.appendChild(a);
                    } else {
                        li.textContent = typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion);
                    }
                    audioSuggestionsList.appendChild(li);
                });
            }
            document.getElementById('audioSuggestionsSection').classList.remove('hidden');
        } else {
            document.getElementById('timeTwitter').innerHTML = '';
            document.getElementById('timeLinkedIn').innerHTML = '';
            document.getElementById('timeInstagram').innerHTML = '';
            document.getElementById('hashtagsTwitter').innerHTML = '';
            document.getElementById('hashtagsLinkedIn').innerHTML = '';
            document.getElementById('hashtagsInstagram').innerHTML = '';
            document.getElementById('audioSuggestionsSection').classList.add('hidden');
        }
        
        const extractedText = document.getElementById('extractedText');
        extractedText.value = extractResult.text || 'No text extracted.';
        const resultMeta = document.getElementById('resultMeta');
        if (extractResult.confidence) {
            resultMeta.textContent = `Confidence: ${extractResult.confidence}%`;
        } else if (extractResult.pageCount) {
            resultMeta.textContent = `Pages: ${extractResult.pageCount}`;
        } else {
            resultMeta.textContent = '';
        }
    }

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

            let scoreResult = null;
            if (classifyResult) {
                try {
                    const scorePayload = { 
                        text: extractResult.text,
                        classification: classifyResult
                    };
                    
                    if (compareContext && compareContext.data && compareContext.data.scoreResult) {
                        scorePayload.previousScoreContext = compareContext.data.scoreResult;
                    }

                    const scoreResponse = await fetch('/api/score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(scorePayload)
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
            
            const resultData = {
                extractResult,
                classifyResult,
                scoreResult,
                rewriteResult,
                suggestResult
            };

            if (compareContext) {
                const newAnalysis = {
                    id: Date.now(),
                    title: 'Revision: ' + (resultData.classifyResult?.summary?.substring(0, 20) || 'Analysis') + '...',
                    data: resultData
                };
                analysisHistory.unshift(newAnalysis);
                if (analysisHistory.length > 20) analysisHistory.pop();
                localStorage.setItem('echo_recent_analyses', JSON.stringify(analysisHistory));
                currentAnalysisId = newAnalysis.id;
                
                populateUI(resultData, compareContext.data);
                compareContext = null;
                revisionBanner.classList.add('hidden');
            } else {
                const newAnalysis = {
                    id: Date.now(),
                    title: resultData.classifyResult?.summary?.substring(0, 30) + '...' || 'New Analysis',
                    data: resultData
                };
                analysisHistory.unshift(newAnalysis);
                if (analysisHistory.length > 20) analysisHistory.pop();
                localStorage.setItem('echo_recent_analyses', JSON.stringify(analysisHistory));
                currentAnalysisId = newAnalysis.id;
                
                populateUI(resultData, null);
            }
            renderHistory();

        } catch (error) {
            console.error('Error:', error);
            showErrorBanner(error.message);
            showStatus('', '');
            submitBtn.disabled = false;
            textInput.placeholder = compareContext ? 'Upload a modified document for comparison...' : 'Ready to analyze...';
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
        if (currentAnalysisId) {
            compareContext = analysisHistory.find(a => a.id === currentAnalysisId);
            revisionTitle.textContent = compareContext.title || 'Previous Analysis';
            revisionBanner.classList.remove('hidden');
        }
        resultPanel.classList.add('hidden');
        centerGreeting.classList.remove('hidden');
        inputWrapper.classList.remove('hidden');
        removeBtn.click();
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
