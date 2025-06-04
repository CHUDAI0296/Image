from flask import Flask, request, jsonify
import requests
import time
import os
from dotenv import load_dotenv

# 加载.env文件中的环境变量
load_dotenv()

app = Flask(__name__)

# 从环境变量读取API密钥
REPLICATE_API_KEY = os.getenv('REPLICATE_API_KEY')
REPLICATE_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'

@app.route('/api/comic', methods=['POST'])
def comic():
    data = request.json
    image_base64 = data['image']
    payload = {
        'version': REPLICATE_MODEL,
        'input': {
            'image': image_base64,
            'prompt': "comic book style, bold lines, vibrant colors, comic art, graphic novel style, detailed comic illustration",
            'negative_prompt': "photorealistic, realistic, photograph, blurry, low quality",
            'num_inference_steps': 50,
            'guidance_scale': 7.5,
            'strength': 0.75
        }
    }
    headers = {
        'Authorization': f'Token {REPLICATE_API_KEY}',
        'Content-Type': 'application/json'
    }
    # 第一步：创建预测
    r = requests.post('https://api.replicate.com/v1/predictions', json=payload, headers=headers)
    if r.status_code != 201:
        print('Replicate API 创建预测失败:', r.text)
        return jsonify({'error': '创建预测失败', 'detail': r.json()}), 500
    prediction = r.json()
    prediction_id = prediction['id']

    # 第二步：轮询获取结果
    for _ in range(60):
        status_r = requests.get(f'https://api.replicate.com/v1/predictions/{prediction_id}', headers=headers)
        status = status_r.json()
        if status['status'] == 'succeeded':
            return jsonify({'output': status['output'][0]})
        elif status['status'] == 'failed':
            print('Replicate API 生成失败:', status_r.text)
            return jsonify({'error': '生成失败', 'detail': status}), 500
        time.sleep(1)
    return jsonify({'error': '生成超时'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True) 