// Helper for CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body", details: e.message }), {
        status: 400,
        headers: corsHeaders
      });
    }

    try {
      // 兼容前端参数
      const prompt = data.prompt || '';
      const negative_prompt = data.negative_prompt || '';
      
      if (!prompt) {
        return new Response(JSON.stringify({ error: "prompt is required" }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // 异步请求 fal.ai，并带上 sync_mode=false 获取任务状态URL
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
          },
          // 关键：使用异步模式，让 fal.ai 立刻返回一个查询URL
          sync_mode: false 
        })
      });

      const result = await response.json();

      // 直接将 fal.ai 的初始响应（包含查询URL）返回给前端
      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: corsHeaders
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal Worker error", details: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
}