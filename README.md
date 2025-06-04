# 图像魔方 - 多功能图片处理工具

一个基于 HTML5 和 CSS3 开发的多功能图片处理工具网站，采用苹果风格设计，提供多种图片处理功能。

## 功能特点

- 图片压缩：支持多种格式图片压缩
- 格式转换：支持多种图片格式互转
- AI文生图：使用 AI 生成图片
- AI动漫头像：将照片转换为动漫风格头像
- 图片转漫画：将照片转换为漫画风格
- 视频转实况照片：将视频转换为实况照片
- AI生成Logo：使用 AI 生成企业 Logo
- 去水印：去除图片中的水印
- 大疆水印：添加大疆风格的水印

## 技术栈

- 前端：HTML5、CSS3、JavaScript
- 后端：Python + Flask
- AI 模型：Replicate API

## 本地开发

1. 安装 Python 依赖：
```bash
pip install -r requirements.txt
```

2. 下载中文字体：
```bash
mkdir fonts
# 下载 Noto Sans SC 字体到 fonts 目录
```

3. 启动后端服务：
```bash
python watermark_api.py
```

4. 使用本地服务器访问前端页面：
```bash
python -m http.server 8000
```

5. 在浏览器中访问：http://localhost:8000

## 功能说明

### 去水印功能
- 支持输入图片 URL
- 使用 AI 模型自动去除水印
- 支持预览和下载处理后的图片

### 大疆水印功能
- 支持本地上传图片
- 可选择或自定义机型
- 支持自动获取当前时间或自定义时间
- 支持自动获取当前位置或手动输入经纬度
- 支持预览和下载带水印的图片

## 注意事项

1. 需要配置 Replicate API Key
2. 需要安装中文字体
3. 建议使用现代浏览器访问
4. 本地开发时需要使用本地服务器访问页面

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

MIT License 