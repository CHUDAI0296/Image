// dji-watermark.js
// 机型和时间下拉选择与自定义输入联动逻辑
// 详细中文注释，苹果风格

document.addEventListener('DOMContentLoaded', function() {
    // 获取相关元素
    const modelSelect = document.getElementById('modelSelect');
    const modelInput = document.getElementById('modelInput');
    const timeSelect = document.getElementById('timeSelect');
    const timeInput = document.getElementById('timeInput');
    const gpsInput = document.getElementById('gpsInput');
    const locateBtn = document.getElementById('locateBtn');
    const uploadArea = document.getElementById('djiUploadArea');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('djiInput');
    const previewImg = document.getElementById('djiPreviewImg');
    const addWatermarkBtn = document.getElementById('addWatermarkBtn');
    const resultArea = document.getElementById('djiResultArea');
    const resultImg = document.getElementById('djiResultImg');
    const downloadBtn = document.getElementById('djiDownloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // 机型下拉选择联动
    modelSelect.addEventListener('change', function() {
        if (this.value === '自定义') {
            modelInput.style.display = 'block';
            modelInput.required = true;
        } else {
            modelInput.style.display = 'none';
            modelInput.required = false;
        }
    });

    // 时间下拉选择联动
    timeSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            timeInput.style.display = 'block';
            timeInput.required = true;
        } else {
            timeInput.style.display = 'none';
            timeInput.required = false;
            // 自动填充当前时间
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            timeInput.value = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
        }
    });

    // 页面加载时自动填充当前时间（如果选中"当前时间"）
    if (timeSelect.value === 'now') {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }

    // 上传区点击和拖拽上传逻辑
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // 支持拖拽上传
    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.style.background = '#E6EFFF';
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
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });

    // 经纬度定位按钮逻辑
    locateBtn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            alert('当前浏览器不支持定位功能');
            return;
        }
        locateBtn.textContent = '定位中...';
        locateBtn.disabled = true;
        navigator.geolocation.getCurrentPosition(function(pos) {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            gpsInput.value = `${lat}°N, ${lng}°E`;
            locateBtn.textContent = '📍';
            locateBtn.disabled = false;
        }, function(err) {
            alert('定位失败，请检查浏览器权限或网络');
            locateBtn.textContent = '📍';
            locateBtn.disabled = false;
        }, {enableHighAccuracy:true,timeout:10000});
    });

    // 添加水印按钮逻辑
    addWatermarkBtn.addEventListener('click', async function() {
        if (!fileInput.files || !fileInput.files[0]) {
            alert('请先上传图片');
            return;
        }

        const model = modelSelect.value === '自定义' ? modelInput.value : modelSelect.value;
        const time = timeSelect.value === 'custom' ? timeInput.value : timeInput.value;
        const gps = gpsInput.value;

        if (!model || !time || !gps) {
            alert('请填写完整信息');
            return;
        }

        // 显示加载状态
        loadingIndicator.style.display = 'block';
        addWatermarkBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            formData.append('model', model);
            formData.append('time', time);
            formData.append('gps', gps);

            const response = await fetch('http://localhost:5000/api/add-dji-watermark', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // 显示结果
            resultImg.src = data.image;
            resultArea.style.display = 'block';
            
            // 设置下载按钮
            downloadBtn.onclick = function() {
                const link = document.createElement('a');
                link.href = data.image;
                link.download = 'dji-watermark.png';
                link.click();
            };

        } catch (error) {
            alert('处理失败：' + error.message);
        } finally {
            // 隐藏加载状态
            loadingIndicator.style.display = 'none';
            addWatermarkBtn.disabled = false;
        }
    });
}); 