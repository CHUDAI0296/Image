// 图片转漫画功能脚本（DeepAI 免费API版）
// 1. 监听上传区域图片选择/拖拽
// 2. 调用 DeepAI CartoonGAN API 将图片转为漫画风格
// 3. 显示生成结果并支持下载
// 4. 详细中文注释，适合初中生理解

// 你需要在 https://deepai.org/ 注册获取API Key，并替换下面的 YOUR_DEEPAI_API_KEY
const DEEPAI_API_KEY = 'c4b1afe8-4411-4346-8351-4d2173750585'; // TODO: 替换为你的 DeepAI API Key

// Cloudflare Worker 代理API地址，保护API密钥安全
const API_URL = 'https://wild-night-aa18.1504478674.workers.dev';

// 获取上传区域和结果显示区域
const uploadArea = document.getElementById('comicUploadArea');
const fileInput = uploadArea.querySelector('input[type="file"]');
const previewBox = document.getElementById('comicPreview');
const previewImg = document.getElementById('comicImage');
const downloadBtn = document.getElementById('downloadComic');
const loadingTip = document.getElementById('comicLoading');
const errorTip = document.getElementById('comicError');

// 监听点击上传区域，触发文件选择
uploadArea.addEventListener('click', () => fileInput.click());

// 监听文件选择
fileInput.addEventListener('change', handleFile);

// 支持拖拽上传
uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.style.background = '#FFF7E6';
});
uploadArea.addEventListener('dragleave', e => {
    e.preventDefault();
    uploadArea.style.background = '';
});
uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.style.background = '';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        handleFile();
    }
});

// 处理文件上传
async function handleFile() {
    const file = fileInput.files[0];
    if (!file) return;
    // 显示加载中
    loadingTip.style.display = 'block';
    errorTip.style.display = 'none';
    previewBox.style.display = 'none';
    // 调用 Cloudflare Worker 代理API
    try {
        const resultUrl = await generateComicStyleWithWorker(file);
        loadingTip.style.display = 'none';
        previewImg.src = resultUrl;
        previewBox.style.display = 'block';
        downloadBtn.onclick = () => downloadImage(resultUrl);
    } catch (error) {
        loadingTip.style.display = 'none';
        errorTip.style.display = 'block';
        errorTip.textContent = '生成失败，请重试或检查API Key';
    }
}

// 通过 Cloudflare Worker 代理API 生成漫画风格图片
async function generateComicStyleWithWorker(file) {
    const formData = new FormData();
    formData.append('image', file);
    // 将图片转为 base64 字符串
    const base64 = await fileToBase64(file);
    // 通过 Worker 代理API
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'cartoon-gan', // 标记漫画风格
            image_base64: base64
        })
    });
    const data = await response.json();
    if (response.ok && data.output) {
        return data.output;
    } else {
        console.error('Worker API 错误详情:', data);
        throw new Error(data.error || '生成失败');
    }
}

// 工具函数：文件转base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 下载图片
function downloadImage(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comic.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
} 