// AI头像生成（动漫风格）功能脚本
// 适用于 pages/ai-avatar.html
// 调用 Cloudflare Worker 代理API，保护API密钥安全

// 获取DOM元素
const avatarForm = document.getElementById('avatarForm');
const avatarPrompt = document.getElementById('avatarPrompt');
const avatarPreview = document.getElementById('avatarPreview');
const avatarImage = document.getElementById('avatarImage');
const downloadAvatar = document.getElementById('downloadAvatar');
const avatarLoading = document.getElementById('avatarLoading');
const avatarError = document.getElementById('avatarError');

// API配置
const API_URL = 'https://wild-night-aa18.1504478674.workers.dev'; // 你的Cloudflare Worker地址
const REPLICATE_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'; // 可替换为动漫头像模型

// 监听表单提交
avatarForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const prompt = avatarPrompt.value.trim();
    if (!prompt) return;
    avatarPreview.style.display = 'none';
    avatarError.style.display = 'none';
    avatarLoading.style.display = 'block';
    avatarLoading.textContent = '头像生成中，请稍候...';
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
            avatarPreview.src = imageUrl;
            downloadAvatar.href = imageUrl; // 设置下载链接
            avatarPreview.style.display = 'block';
        } else {
            throw new Error('API 返回的数据格式不正确，没有找到图片 URL');
        }

    } catch (err) {
        avatarLoading.style.display = 'none';
        avatarError.style.display = 'block';
        avatarError.textContent = err.message || '头像生成失败，请检查网络或稍后再试';
    }
});

// 下载头像
if (downloadAvatar) {
    downloadAvatar.addEventListener('click', function () {
        if (avatarImage.src) {
            const link = document.createElement('a');
            link.href = avatarImage.src;
            link.download = 'ai_avatar.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
} 