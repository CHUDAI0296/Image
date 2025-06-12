// AI Logo生成（品牌Logo设计）功能脚本
// 适用于 pages/ai-logo.html
// 调用 Cloudflare Worker 代理API，保护API密钥安全

// 获取DOM元素
const logoForm = document.getElementById('logoForm');
const logoPrompt = document.getElementById('logoPrompt');
const logoPreview = document.getElementById('logoPreview');
const logoImage = document.getElementById('logoImage');
const downloadLogo = document.getElementById('downloadLogo');
const logoLoading = document.getElementById('logoLoading');
const logoError = document.getElementById('logoError');

// API配置
const API_URL = 'https://wild-night-aa18.1504478674.workers.dev'; // 你的Cloudflare Worker地址
const REPLICATE_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'; // 可替换为Logo生成模型

// 监听表单提交
logoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const prompt = logoPrompt.value.trim();
    if (!prompt) return;
    logoPreview.style.display = 'none';
    logoError.style.display = 'none';
    logoLoading.style.display = 'block';
    logoLoading.textContent = 'Logo生成中，请稍候...';
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.details?.message || errData.error || 'API 请求失败');
        }

        const data = await response.json();

        // 从 fal.ai 的返回结果中提取图片 URL
        if (data && data.output && data.output.images && data.output.images.length > 0) {
            const imageUrl = data.output.images[0].url;
            logoPreview.src = imageUrl;
            downloadLogo.href = imageUrl; // 设置下载链接
            logoPreview.style.display = 'block';
        } else {
            throw new Error('API 返回的数据格式不正确，没有找到图片 URL');
        }

    } catch (err) {
        logoError.textContent = err.message;
        logoError.style.display = 'block';
    } finally {
        logoLoading.style.display = 'none';
    }
});

// 下载Logo
if (downloadLogo) {
    downloadLogo.addEventListener('click', function () {
        if (logoImage.src) {
            const link = document.createElement('a');
            link.href = logoImage.src;
            link.download = 'ai_logo.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
} 