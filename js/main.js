// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');

// 当前处理的图片文件
let currentFile = null;
let currentCompressedFile = null;

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 压缩图片
async function compressImage(file, quality) {
    try {
        console.log('开始压缩图片，质量：', quality);
        console.log('原始文件大小：', formatFileSize(file.size));

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: quality / 100,
            initialQuality: quality / 100
        };

        console.log('压缩选项：', options);

        const compressedFile = await imageCompression(file, options);
        console.log('压缩后文件大小：', formatFileSize(compressedFile.size));
        
        return compressedFile;
    } catch (error) {
        console.error('压缩失败:', error);
        alert('图片压缩失败，请重试');
        return null;
    }
}

// 更新预览
async function updatePreview(file, quality) {
    if (!file) return;

    console.log('更新预览，质量：', quality);

    // 显示原始图片
    const originalUrl = URL.createObjectURL(file);
    originalImage.src = originalUrl;
    originalSize.textContent = formatFileSize(file.size);

    // 压缩图片
    const compressedFile = await compressImage(file, quality);
    if (compressedFile) {
        // 更新当前压缩后的文件
        currentCompressedFile = compressedFile;
        
        // 更新预览图片
        const compressedUrl = URL.createObjectURL(compressedFile);
        compressedImage.src = compressedUrl;
        compressedSize.textContent = formatFileSize(compressedFile.size);

        console.log('预览更新完成');
    }
}

// 处理文件上传
function handleFileUpload(file) {
    if (!file.type.match(/image\/(jpeg|png)/)) {
        alert('请上传 JPG 或 PNG 格式的图片');
        return;
    }

    console.log('处理文件上传：', file.name);
    currentFile = file;
    previewContainer.style.display = 'block';
    updatePreview(file, qualitySlider.value);
}

// 事件监听器
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#007AFF';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#e0e0e0';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#e0e0e0';
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
});

qualitySlider.addEventListener('input', async (e) => {
    const quality = e.target.value;
    qualityValue.textContent = quality + '%';
    console.log('质量滑块改变：', quality);
    
    if (currentFile) {
        await updatePreview(currentFile, quality);
    }
});

downloadBtn.addEventListener('click', () => {
    if (currentCompressedFile) {
        console.log('下载压缩后的文件');
        const link = document.createElement('a');
        const url = URL.createObjectURL(currentCompressedFile);
        link.href = url;
        link.download = 'compressed_' + currentFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        alert('请先上传并压缩图片');
    }
}); 