// AI头像生成（动漫风格）功能脚本
// 适用于 pages/ai-avatar.html
// 调用 Cloudflare Worker 代理API，保护API密钥安全

// Get the necessary DOM elements
const generateForm = document.getElementById('generateForm');
const promptInput = document.getElementById('prompt');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const resultContainer = document.getElementById('result-container');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');

// Your Cloudflare Worker proxy URL that protects your API key
const API_URL = 'https://wild-night-aa18.1504478674.workers.dev';

// Handle form submission
generateForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    // We add a style modifier to the prompt to get a consistent anime/avatar style
    const styledPrompt = `${prompt}, anime style, high quality, detailed, professional portrait`;

    // Reset UI state
    resultContainer.style.display = 'none';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    loadingDiv.textContent = 'Task submitted, waiting in queue... (0%)';

    try {
        // Step 1: Submit the task to our Worker
        const initialResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: styledPrompt }) // Use the styled prompt
        });

        if (!initialResponse.ok) {
            const errData = await initialResponse.json();
            throw new Error(errData.details?.message || errData.error || 'API request failed');
        }

        const task = await initialResponse.json();

        // Get the URL to poll for the task status
        const statusUrl = task._links?.get;
        if (!statusUrl) {
            throw new Error('Could not get task status URL');
        }

        // Step 2: Poll for the result
        await pollForResult(statusUrl);

    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
    }
});

// Polling function to check the task status until it's complete
async function pollForResult(statusUrl) {
    const pollInterval = 3000; // Poll every 3 seconds

    const poll = async () => {
        try {
            const response = await fetch(statusUrl);
            if (!response.ok) {
                throw new Error(`Polling failed with status: ${response.status}`);
            }
            const statusResult = await response.json();

            if (statusResult.status === 'IN_PROGRESS' || statusResult.status === 'IN_QUEUE') {
                // Task is still running, update progress and continue polling
                const progress = statusResult.progress ? statusResult.progress.percentage : 0;
                loadingDiv.textContent = `Generating avatar... (${progress}%)`;
                setTimeout(poll, pollInterval);
            } else if (statusResult.status === 'SUCCEEDED') {
                // Task succeeded, display the image
                const imageUrl = statusResult.output.images[0].url;
                resultImage.src = imageUrl;
                downloadBtn.href = imageUrl; // Set download link
                resultContainer.style.display = 'block';
                loadingDiv.style.display = 'none';
            } else {
                // Task failed, show the error message
                const errorMessage = statusResult.error?.message || 'An unknown error occurred';
                throw new Error(`Generation failed: ${errorMessage}`);
            }
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
            loadingDiv.style.display = 'none';
        }
    };

    // Start the first poll
    poll();
}

// 下载头像
if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
        if (resultImage.src) {
            const link = document.createElement('a');
            link.href = resultImage.src;
            link.download = 'ai_avatar.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
} 