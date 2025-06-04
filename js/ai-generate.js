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