// 获取DOM元素
const aiForm = document.getElementById('aiForm');
const promptInput = document.getElementById('prompt');
const aiPreview = document.getElementById('aiPreview');
const aiImage = document.getElementById('aiImage');
const downloadAI = document.getElementById('downloadAI');
aiPreview.style.display = 'none';
const aiLoading = document.getElementById('aiLoading');
const aiError = document.getElementById('aiError');

// DeepAI API Key（免费体验，无需注册）
const DEEPAI_API_KEY = 'c4b1afe8-4411-4346-8351-4d2173750585';

// 生成图片
aiForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    aiPreview.style.display = 'none';
    aiError.style.display = 'none';
    aiLoading.style.display = 'block';
    aiLoading.textContent = '图片生成中，请稍候...';

    try {
        const response = await fetch('https://api.deepai.org/api/text2img', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'api-key': DEEPAI_API_KEY
            },
            body: `text=${encodeURIComponent(prompt)}`
        });
        const data = await response.json();
        if (data.output_url) {
            aiImage.src = data.output_url;
            aiPreview.style.display = 'block';
            aiLoading.style.display = 'none';
        } else {
            throw new Error(data.err || '图片生成失败，请稍后再试');
        }
    } catch (err) {
        aiLoading.style.display = 'none';
        aiError.style.display = 'block';
        aiError.textContent = err.message || '图片生成失败，请检查网络或稍后再试';
    }
});

// 下载图片
downloadAI.addEventListener('click', function () {
    if (aiImage.src) {
        const link = document.createElement('a');
        link.href = aiImage.src;
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
    const API_URL = 'https://wild-night-aa18.1504478674.workers.dev'; // ← 这里填写你的 Worker 地址
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