document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('classifier-form');
    const loading = document.getElementById('loading');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    const copyPredictionBtn = document.getElementById('copy-prediction');
    const predictionContainer = document.querySelector('.mt-6.p-4.bg-gray-50.rounded-lg') || document.createElement('div');
    const errorContainer = document.querySelector('.text-red-600.text-center.mt-4') || document.createElement('p');

    // Ensure containers are in the DOM
    if (!predictionContainer.parentElement) {
        predictionContainer.className = 'mt-6 p-4 bg-gray-50 rounded-lg';
        form.insertAdjacentElement('afterend', predictionContainer);
    }
    if (!errorContainer.parentElement) {
        errorContainer.className = 'text-red-600 text-center mt-4';
        form.insertAdjacentElement('afterend', errorContainer);
    }

    // Load history from localStorage
    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem('emailHistory')) || [];
        console.log('Loaded history:', history); // Debug log
        historyList.innerHTML = '';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item border border-gray-200';
            div.innerHTML = `
                <p><strong>Message:</strong> ${item.message.substring(0, 100)}${item.message.length > 100 ? '...' : ''}</p>
                <p><strong>Prediction:</strong> ${item.prediction}</p>
                ${item.confidence ? `<p><strong>Confidence:</strong> ${item.confidence}%</p>` : ''}
                <p><strong>Time:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
            `;
            historyList.prepend(div);
        });
    };

    // Save prediction to history
    const saveToHistory = (message, prediction, confidence) => {
        const history = JSON.parse(localStorage.getItem('emailHistory')) || [];
        const historyItem = { message, prediction, confidence, timestamp: new Date().toISOString() };
        history.push(historyItem);
        console.log('Saving to history:', historyItem); // Debug log
        localStorage.setItem('emailHistory', JSON.stringify(history));
        loadHistory();
    };

    // Form submission with loading animation
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        loading.classList.remove('hidden');
        errorContainer.textContent = ''; // Clear previous errors
        predictionContainer.innerHTML = ''; // Clear previous prediction

        const formData = new FormData(form);
        const message = formData.get('message'); // Get message before fetch

        fetch(form.action, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json()) // Expect JSON response from backend
        .then(data => {
            loading.classList.add('hidden');

            // Update error if any
            if (data.error) {
                errorContainer.textContent = data.error;
                return;
            }

            // Update prediction
            if (data.prediction) {
                predictionContainer.innerHTML = `
                    <h3 class="text-xl font-semibold text-gray-800">Prediction: <span id="prediction-text">${data.prediction}</span></h3>
                    ${data.confidence ? `<p class="text-gray-600">Confidence: <span id="confidence-text">${data.confidence}%</span></p>` : ''}
                    <button id="copy-prediction" class="mt-2 text-indigo-600 hover:text-indigo-800 underline">Copy Prediction</button>
                `;

                // Save to history
                saveToHistory(message, data.prediction, data.confidence || null);

                // Reattach copy prediction event listener
                const newCopyPredictionBtn = document.getElementById('copy-prediction');
                if (newCopyPredictionBtn) {
                    newCopyPredictionBtn.addEventListener('click', () => {
                        const predText = document.getElementById('prediction-text').textContent;
                        const confText = document.getElementById('confidence-text')?.textContent || '';
                        const textToCopy = `Prediction: ${predText}${confText ? `\nConfidence: ${confText}` : ''}`;
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            newCopyPredictionBtn.textContent = 'Copied!';
                            setTimeout(() => {
                                newCopyPredictionBtn.textContent = 'Copy Prediction';
                            }, 2000);
                        });
                    });
                }
            }
        })
        .catch(error => {
            loading.classList.add('hidden');
            errorContainer.textContent = 'An error occurred while fetching the prediction.';
            console.error('Error:', error);
        });
    });

    // Clear history
    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('emailHistory');
        loadHistory();
        console.log('History cleared'); // Debug log
    });

    // Initial history load
    loadHistory();
}); 