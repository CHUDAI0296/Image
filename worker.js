// Cloudflare Worker 代理 RapidAPI，适配AI生图/头像/Logo等功能
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 处理 CORS 预检请求
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

  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }

  try {
    // 读取前端传来的参数
    const data = await request.json();
    // 从 Cloudflare 环境变量获取 RapidAPI Key
    const rapidApiKey = RAPIDAPI_KEY;
    // RapidAPI 的目标接口地址
    const rapidApiUrl = 'https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/aaaaaaaaiimagegenerator/quick.php';
    // 转发请求到 RapidAPI
    const response = await fetch(rapidApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'ai-text-to-image-generator-flux-free-api.p.rapidapi.com'
      },
      body: JSON.stringify(data)
    });
    const result = await response.text(); // RapidAPI 可能返回 text 或 json
    return new Response(result, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}