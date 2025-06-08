// Cloudflare Worker for Replicate API proxy
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 处理 CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // 只处理 POST 请求
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }

  try {
    // 获取请求数据
    const data = await request.json()
    const prompt = data.prompt
    const model = data.model
    const negative_prompt = data.negative_prompt
    const num_inference_steps = data.num_inference_steps || 50
    const guidance_scale = data.guidance_scale || 7.5

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // 从环境变量获取 API 密钥
    const REPLICATE_API_KEY = REPLICATE_API_KEY

    // 准备 Replicate API 请求
    const payload = {
      version: model,
      input: {
        prompt: prompt,
        negative_prompt: negative_prompt,
        num_inference_steps: num_inference_steps,
        guidance_scale: guidance_scale
      }
    }

    // 第一步：创建预测
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!createResponse.ok) {
      throw new Error('Failed to create prediction')
    }

    const prediction = await createResponse.json()
    const predictionId = prediction.id

    // 第二步：轮询获取结果
    for (let i = 0; i < 60; i++) {
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_KEY}`
        }
      })

      const status = await statusResponse.json()

      if (status.status === 'succeeded') {
        return new Response(JSON.stringify({ output: status.output[0] }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      } else if (status.status === 'failed') {
        throw new Error('Generation failed')
      }

      // 等待1秒后继续轮询
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    throw new Error('Generation timeout')

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
} 