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
                prompt: prompt + ', anime portrait, high quality, clean background',
                model: REPLICATE_MODEL,
                negative_prompt: 'blurry, low quality, distorted, deformed',
                num_inference_steps: 50,
                guidance_scale: 7.5
            })
        });
        const data = await response.json();
        if (data.output) {
            avatarImage.src = data.output;
            avatarPreview.style.display = 'block';
            avatarLoading.style.display = 'none';
        } else {
            throw new Error(data.error || '头像生成失败，请稍后再试');
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