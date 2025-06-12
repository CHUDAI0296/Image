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
    aiLoading.textContent = '任务已提交，正在排队等待处理... (0%)';

    try {
        // 第一步：向我们的Worker提交任务
        const initialResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
            })
        });

        if (!initialResponse.ok) {
            const errData = await initialResponse.json();
            throw new Error(errData.details?.message || errData.error || 'API 请求失败');
        }

        const task = await initialResponse.json();

        // 从返回结果中获取用于查询状态的URL
        const statusUrl = task._links?.get;
        if (!statusUrl) {
            throw new Error('无法获取任务状态查询链接');
        }

        // 第二步：轮询任务状态
        await pollForResult(statusUrl);

    } catch (err) {
        aiError.textContent = err.message;
        aiError.style.display = 'block';
        aiLoading.style.display = 'none';
    }
});

// 轮询函数，用于反复查询任务状态直到完成
async function pollForResult(statusUrl) {
    const pollInterval = 3000; // 每3秒查询一次

    const poll = async () => {
        const response = await fetch(statusUrl);
        const statusResult = await response.json();

        if (statusResult.status === 'IN_PROGRESS' || statusResult.status === 'IN_QUEUE') {
            // 如果还在处理中，更新进度条并继续轮询
            const progress = statusResult.progress ? statusResult.progress.percentage : 0;
            aiLoading.textContent = `图片生成中... (${progress}%)`;
            setTimeout(poll, pollInterval);
        } else if (statusResult.status === 'SUCCEEDED') {
            // 如果成功，显示图片
            const imageUrl = statusResult.output.images[0].url;
            aiImage.src = imageUrl;
            downloadAI.href = imageUrl;
            aiPreview.style.display = 'block';
            aiLoading.style.display = 'none';
        } else {
            // 如果失败，显示错误信息
            throw new Error(`生成失败: ${statusResult.error?.message || '未知错误'}`);
        }
    };

    // 开始第一次轮询
    poll();
}

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