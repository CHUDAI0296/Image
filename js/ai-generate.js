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
            body: JSON.stringify({ prompt: prompt })
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
                loadingDiv.textContent = `Generating image... (${progress}%)`;
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

// Download image
downloadBtn.addEventListener('click', function () {
    if (resultImage.src) {
        const link = document.createElement('a');
        link.href = resultImage.src;
        link.download = 'ai_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const generateForm = document.getElementById('generateForm');
    const promptInput = document.getElementById('prompt');
    const preview = document.getElementById('preview');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const downloadBtn = document.getElementById('downloadImage');
    const generatedImage = document.getElementById('generatedImage');

    // API configuration
    // 修改为你的 Cloudflare Worker 代理 API 地址，保护API密钥安全
    const REPLICATE_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

    // Handle form submission
    generateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        loading.style.display = 'block';
        error.style.display = 'none';
        preview.style.display = 'none';
        
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            error.textContent = 'Please enter a description';
            error.style.display = 'block';
            loading.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: REPLICATE_MODEL,
                    negative_prompt: "blurry, low quality, distorted, deformed",
                    num_inference_steps: 50,
                    guidance_scale: 7.5
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Display generated image
            generatedImage.src = data.output;
            
            // Set up download button
            downloadBtn.onclick = function() {
                const link = document.createElement('a');
                link.href = data.output;
                link.download = 'generated-image.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            preview.style.display = 'block';
        } catch (err) {
            error.textContent = err.message || 'Failed to generate image. Please try again.';
            error.style.display = 'block';
        } finally {
            loading.style.display = 'none';
        }
    });
}); 