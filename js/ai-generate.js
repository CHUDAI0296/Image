// 获取DOM元素
const aiForm = document.getElementById('aiForm');
const promptInput = document.getElementById('prompt');
const aiPreview = document.getElementById('aiPreview');
const aiImage = document.getElementById('aiImage');
const downloadAI = document.getElementById('downloadAI');
aiPreview.style.display = 'none';
const aiLoading = document.getElementById('aiLoading');
const aiError = document.getElementById('aiError');

// Cloudflare Worker 代理API地址，保护API密钥安全
const API_URL = 'https://wild-night-aa18.1504478674.workers.dev';

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
        // 调用我们的 Worker
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                // 如果有负面提示输入框，也可以传
                // negative_prompt: negativePromptInput.value.trim() 
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.details?.message || errData.error || 'API 请求失败');
        }

        const data = await response.json();

        // 从 fal.ai 的返回结果中提取图片 URL
        // fal.ai 的图片在 output.images[0].url
        if (data && data.output && data.output.images && data.output.images.length > 0) {
            const imageUrl = data.output.images[0].url;
            aiImage.src = imageUrl;
            // 设置下载按钮的链接
            downloadAI.href = imageUrl;
            aiPreview.style.display = 'block';
        } else {
            throw new Error('API 返回的数据格式不正确，没有找到图片 URL');
        }

    } catch (err) {
        aiError.textContent = err.message;
        aiError.style.display = 'block';
    } finally {
        aiLoading.style.display = 'none';
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