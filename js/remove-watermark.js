// 去水印功能的前端逻辑
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const previewImg = document.getElementById('previewImg');
    const resultImg = document.getElementById('resultImg');
    const resultArea = document.getElementById('resultArea');
    const downloadBtn = document.getElementById('downloadBtn');
    const processBtn = document.getElementById('processBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // 预览图片
    urlInput.addEventListener('input', function() {
        const url = this.value.trim();
        if (url) {
            previewImg.src = url;
            previewImg.style.display = 'block';
        } else {
            previewImg.style.display = 'none';
        }
    });

    // 处理图片
    processBtn.addEventListener('click', async function() {
        const url = urlInput.value.trim();
        if (!url) {
            alert('请输入图片URL');
            return;
        }

        // 显示加载状态
        loadingIndicator.style.display = 'block';
        processBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:5000/api/remove-watermark', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_url: url
                })
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // 显示结果
            resultImg.src = data.output;
            resultArea.style.display = 'block';
            
            // 设置下载按钮
            downloadBtn.onclick = function() {
                const link = document.createElement('a');
                link.href = data.output;
                link.download = 'removed-watermark.png';
                link.click();
            };

        } catch (error) {
            alert('处理失败：' + error.message);
        } finally {
            // 隐藏加载状态
            loadingIndicator.style.display = 'none';
            processBtn.disabled = false;
        }
    });
}); 