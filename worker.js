// Cloudflare Worker 代理 RapidAPI，适配AI生图/头像/Logo等功能
export default {
  async fetch(request, env, ctx) {
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
      const data = await request.json();
      // 正确获取环境变量
      const rapidApiKey = env.RAPIDAPI_KEY;
      const rapidApiUrl = 'https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/aaaaaaaaiimagegenerator/quick.php';
      const response = await fetch(rapidApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'ai-text-to-image-generator-flux-free-api.p.rapidapi.com'
        },
        body: JSON.stringify(data)
      });
      const result = await response.text();
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
}