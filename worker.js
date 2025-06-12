export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body", details: e.message }), {
        status: 400, // Bad Request
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    try {
      // 兼容前端参数
      const prompt = data.prompt || '';
      const negative_prompt = data.negative_prompt || '';
      
      if (!prompt) {
        return new Response(JSON.stringify({ error: "prompt is required" }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 你可以根据需要扩展更多参数
      const response = await fetch('https://api.fal.ai/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${env.FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'fal-ai/fast-sdxl',
          input: {
            prompt,
            negative_prompt
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // 如果 fal.ai 返回了错误，将错误信息返回给前端
        return new Response(JSON.stringify({ error: "fal.ai API error", details: result }), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal Worker error", details: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
}