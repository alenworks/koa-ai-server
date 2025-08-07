// 用于向客户端发送 SSE 格式数据
export function sendSSE(res: any, data: any, event: string = 'message') {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// 初始化 SSE 响应流
export function startSSE(res: any) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
}