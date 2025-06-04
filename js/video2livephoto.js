// 视频转实况照片功能脚本
// 1. 监听上传区域视频选择/拖拽
// 2. 用 HTML5 video+canvas 提取关键帧
// 3. 显示所有帧图片，支持一键下载
// 4. 详细中文注释，适合初中生理解

window.onload = function() {
    // 获取上传区域和结果显示区域
    const uploadArea = document.getElementById('videoUploadArea');
    const fileInput = uploadArea.querySelector('input[type="file"]');
    const previewBox = document.getElementById('videoPreview');
    const framesContainer = document.getElementById('videoFramesContainer');
    const downloadBtn = document.getElementById('downloadFrames');
    const loadingTip = document.getElementById('videoLoading');
    const errorTip = document.getElementById('videoError');
    let lastVideoFile = null;
    // 监听点击上传区域，触发文件选择
    uploadArea.addEventListener('click', () => fileInput.click());
    // 监听文件选择
    fileInput.addEventListener('change', handleFile);
    // 支持拖拽上传
    uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.style.background = '#FFECEC';
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
    // 处理视频文件上传
    async function handleFile() {
        const file = fileInput.files[0];
        if (!file) return;
        lastVideoFile = file;
        loadingTip.style.display = 'block';
        errorTip.style.display = 'none';
        previewBox.style.display = 'none';
        framesContainer.innerHTML = '';
        try {
            await extractFrames(file);
        } catch (error) {
            loadingTip.style.display = 'none';
            errorTip.style.display = 'block';
            errorTip.textContent = '视频处理失败，请重试或更换视频';
        }
    }
    // 用 video+canvas 提取视频帧，默认2帧/秒，遍历全视频区间
    async function extractFrames(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.load();
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            video.onloadedmetadata = async () => {
                const videoDuration = video.duration;
                console.log('视频时长:', videoDuration);
                console.log('视频宽高:', video.videoWidth, video.videoHeight);
                try {
                    if (!videoDuration || videoDuration <= 0) {
                        loadingTip.style.display = 'none';
                        errorTip.style.display = 'block';
                        errorTip.textContent = '视频加载失败，无法获取时长，请更换视频或刷新页面';
                        return;
                    }
                    const fps = 2; // 默认2帧/秒
                    const start = 0;
                    const end = videoDuration;
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    console.log('canvas宽高:', canvas.width, canvas.height);
                    let frameImages = [];
                    let frameImgsForGif = [];
                    for (let t = start; t < end; t += 1 / fps) {
                        video.currentTime = t;
                        await new Promise(res => video.onseeked = res);
                        // 增加延时，确保画面刷新
                        await new Promise(res => setTimeout(res, 100));
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imgUrl = canvas.toDataURL('image/jpeg');
                        const img = document.createElement('img');
                        img.src = imgUrl;
                        img.style.width = '160px';
                        img.style.margin = '8px';
                        img.alt = `帧${t.toFixed(1)}`;
                        framesContainer.appendChild(img);
                        frameImages.push(imgUrl);
                        const gifImg = document.createElement('img');
                        gifImg.src = imgUrl;
                        gifImg.width = canvas.width;
                        gifImg.height = canvas.height;
                        frameImgsForGif.push(gifImg);
                    }
                    loadingTip.style.display = 'none';
                    previewBox.style.display = 'block';
                    downloadBtn.onclick = () => downloadAllFrames(frameImages);
                    createGif(frameImgsForGif);
                    resolve();
                } catch (e) {
                    console.error('onloadedmetadata异常:', e);
                }
            };
            video.onerror = (e) => {
                console.error('视频加载失败', e);
                loadingTip.style.display = 'none';
                errorTip.style.display = 'block';
                errorTip.textContent = '视频加载失败，浏览器不支持该格式或文件损坏，请更换视频';
            };
        });
    }
    // 批量下载所有帧图片为zip
    function downloadAllFrames(images) {
        if (!images.length) return;
        // 动态加载 JSZip 库
        if (typeof JSZip === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            script.onload = () => saveZip(images);
            document.body.appendChild(script);
        } else {
            saveZip(images);
        }
    }

    function saveZip(images) {
        const zip = new JSZip();
        images.forEach((dataUrl, i) => {
            // data:image/jpeg;base64,...
            const base64 = dataUrl.split(',')[1];
            zip.file(`frame_${i+1}.jpg`, base64, {base64: true});
        });
        zip.generateAsync({type: 'blob'}).then(content => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'video_frames.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // 新增：合成 GIF 动图并预览
    function createGif(frames) {
        generateGif(frames);
    }

    function generateGif(frames) {
        const gifPreview = document.getElementById('gifPreview');
        const gifContainer = document.getElementById('gifContainer');
        const downloadGif = document.getElementById('downloadGif');
        gifContainer.innerHTML = '';
        // 如果没有帧，给出提示
        if (!frames || frames.length === 0) {
            gifPreview.style.display = 'block';
            gifContainer.innerHTML = '<div style="color:red;">未能提取到有效帧，无法生成动图</div>';
            downloadGif.style.display = 'none';
            return;
        }
        gifPreview.style.display = 'block';
        downloadGif.style.display = 'none'; // 生成前先隐藏下载按钮
        // 创建 GIF 实例
        const gif = new GIF({
            workers: 2,
            quality: 10,
            workerScript: window.gifWorkerUrl || '../js/gif.worker.js', // 本地路径
            width: frames[0].width,
            height: frames[0].height
        });
        // 等待所有帧图片加载完成后再添加到 GIF
        let loadedCount = 0;
        let total = frames.length;
        frames.forEach((img, idx) => {
            if (img.complete) {
                gif.addFrame(img, {delay: 500});
                loadedCount++;
                if (loadedCount === total) {
                    gif.render();
                }
            } else {
                img.onload = () => {
                    gif.addFrame(img, {delay: 500});
                    loadedCount++;
                    if (loadedCount === total) {
                        gif.render();
                    }
                };
                img.onerror = () => {
                    loadedCount++;
                    if (loadedCount === total) {
                        if (gif.frames.length > 0) {
                            gif.render();
                        } else {
                            gifPreview.style.display = 'block';
                            gifContainer.innerHTML = '<div style="color:red;">部分帧加载失败，无法生成动图</div>';
                        }
                    }
                };
            }
        });
        // 监听 GIF 生成完成
        gif.on('finished', function(blob) {
            const url = URL.createObjectURL(blob);
            const gifImg = document.createElement('img');
            gifImg.src = url;
            gifImg.style.maxWidth = '320px';
            gifImg.style.borderRadius = '12px';
            gifImg.alt = '动图预览';
            gifContainer.innerHTML = '';
            gifContainer.appendChild(gifImg);
            downloadGif.style.display = 'inline-block';
            downloadGif.onclick = () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = 'livephoto.gif';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        });
        // 监听 GIF 生成失败
        gif.on('error', function(err) {
            gifPreview.style.display = 'block';
            gifContainer.innerHTML = '<div style="color:red;">GIF生成失败：' + err + '</div>';
            downloadGif.style.display = 'none';
        });
    }
} 