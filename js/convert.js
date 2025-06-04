// 获取DOM元素
const convertUploadArea = document.getElementById('convertUploadArea');
const convertInput = document.getElementById('convertInput');
const convertForm = document.getElementById('convertForm');
const formatSelect = document.getElementById('formatSelect');
const convertPreview = document.getElementById('convertPreview');
const convertImageContainer = document.getElementById('convertImageContainer');
const downloadAll = document.getElementById('downloadAll');
const convertLoading = document.getElementById('convertLoading');
const convertError = document.getElementById('convertError');
const originalPreview = document.getElementById('originalPreview');
const originalImages = document.getElementById('originalImages');
const fileListTbody = document.getElementById('fileListTbody');

let fileList = [];

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 处理文件上传
function handleFileUpload(files) {
    fileList = [];
    fileListTbody.innerHTML = '';
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match(/image\/(jpeg|png|webp|bmp|gif)/)) continue;
        fileList.push({ file, url: URL.createObjectURL(file), checked: true });
    }
    if (fileList.length > 0) {
        document.getElementById('originalListPreview').style.display = 'block';
        fileList.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="file-check" data-idx="${idx}" checked></td>
                <td>${item.file.name}</td>
                <td>${formatFileSize(item.file.size)}</td>
                <td>${item.file.type.split('/')[1].toUpperCase()}</td>
            `;
            fileListTbody.appendChild(tr);
        });
    } else {
        document.getElementById('originalListPreview').style.display = 'none';
    }
    convertError.style.display = 'none';

    // 监听勾选框变化
    Array.from(document.querySelectorAll('.file-check')).forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            fileList[idx].checked = this.checked;
        });
    });
}

// 拖拽上传事件
convertUploadArea.addEventListener('click', () => convertInput.click());
convertUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    convertUploadArea.style.borderColor = '#30D158';
});
convertUploadArea.addEventListener('dragleave', () => {
    convertUploadArea.style.borderColor = '#34C759';
});
convertUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    convertUploadArea.style.borderColor = '#34C759';
    handleFileUpload(e.dataTransfer.files);
});
convertInput.addEventListener('change', (e) => {
    handleFileUpload(e.target.files);
});

// 转换图片
convertForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const checkedFiles = fileList.filter(item => item.checked);
    if (checkedFiles.length === 0) {
        convertError.style.display = 'block';
        convertError.textContent = '请至少勾选一张图片';
        return;
    }
    convertPreview.style.display = 'none';
    convertError.style.display = 'none';
    convertLoading.style.display = 'block';
    convertLoading.textContent = '图片转换中，请稍候...';
    convertImageContainer.innerHTML = '';

    // 存储转换后的图片信息
    let convertedList = [];
    let finished = 0;
    checkedFiles.forEach((item, idx) => {
        const file = item.file;
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                // 创建canvas并绘制图片
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                // 获取目标格式
                const format = formatSelect.value;
                let mimeType = 'image/jpeg';
                if (format === 'png') mimeType = 'image/png';
                if (format === 'webp') mimeType = 'image/webp';
                // 转换图片
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    convertedList[idx] = { blob, url, name: file.name, ext: format, size: blob.size };
                    finished++;
                    // 全部转换完成后渲染
                    if (finished === checkedFiles.length) {
                        renderConvertedList(convertedList);
                        convertPreview.style.display = 'block';
                        convertLoading.style.display = 'none';
                        downloadAll.style.display = 'inline-block';
                    }
                }, mimeType, 0.92);
            };
            img.onerror = function () {
                finished++;
                if (finished === checkedFiles.length) {
                    renderConvertedList(convertedList);
                    convertPreview.style.display = 'block';
                    convertLoading.style.display = 'none';
                    downloadAll.style.display = 'inline-block';
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
});

// 渲染转换结果列表
function renderConvertedList(list) {
    convertImageContainer.innerHTML = '';
    list.forEach((item, idx) => {
        if (!item) return;
        const div = document.createElement('div');
        div.className = 'converted-item-row';
        div.innerHTML = `
            <span class="converted-name">${item.name.replace(/\.[^.]+$/, '')}.${item.ext === 'jpeg' ? 'jpg' : item.ext}</span>
            <span class="converted-size">${formatFileSize(item.size)}</span>
            <button class="download-btn single-download-btn" data-idx="${idx}">下载</button>
        `;
        convertImageContainer.appendChild(div);
    });
    // 单独下载按钮事件
    Array.from(document.querySelectorAll('.single-download-btn')).forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            const item = list[idx];
            if (item && item.blob) {
                const url = URL.createObjectURL(item.blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = item.name.replace(/\.[^.]+$/, '') + '.' + (item.ext === 'jpeg' ? 'jpg' : item.ext);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        });
    });
}

// 批量下载按钮
if (downloadAll) {
    downloadAll.addEventListener('click', async function () {
        const btns = document.querySelectorAll('.single-download-btn');
        if (!btns.length) return;
        const zip = new JSZip();
        let count = 0;
        let total = btns.length;
        Array.from(btns).forEach((btn, idx) => {
            const idxData = parseInt(btn.getAttribute('data-idx'));
            const item = convertImageContainer.children[idxData];
            const name = btn.parentNode.querySelector('.converted-name').textContent;
            const blob = window.convertedList && window.convertedList[idxData] ? window.convertedList[idxData].blob : null;
            if (blob) {
                zip.file(name, blob);
            }
            count++;
            if (count === total) {
                zip.generateAsync({ type: 'blob' }).then(function (content) {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = 'converted_images.zip';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            }
        });
    });
} 