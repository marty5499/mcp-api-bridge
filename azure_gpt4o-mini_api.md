# Azure LLM API 前端串流使用說明

如何在網頁前端使用 `server.js` 提供的 WebSocket API，將使用者的 prompt 發送至後端並即時接收 AI 回應。

---
## 1. 前端集成步驟

1. 參考網頁使用方式：
   ```html
   <!DOCTYPE html>
   <html lang="zh-Hant">
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <style>
       /* 可依據需求調整樣式 */
       body { font-family: Arial, sans-serif; padding: 20px; }
       #chat { white-space: pre-wrap; border: 1px solid #ccc; padding: 10px; max-height: 300px; overflow-y: auto; margin-bottom: 10px; }
       .message.user { color: #0063b1; margin-bottom: 5px; }
       .message.ai { color: #333; margin-bottom: 5px; }
     </style>
   </head>
   <body>
     <div id="chat"></div>
     <input id="prompt" type="text" placeholder="輸入您的 prompt..." />
     <button id="sendBtn">送出</button>
     <script>
       const ws = new WebSocket(`wss://hshgpt.webduino.tw`);
       const chatDiv = document.getElementById('chat');
       const promptInput = document.getElementById('prompt');
       const sendBtn = document.getElementById('sendBtn');

       ws.onopen = () => console.log('WebSocket 已連線');
       ws.onerror = err => console.error('WebSocket 錯誤', err);
       ws.onclose = () => console.log('WebSocket 已斷線');

       ws.onmessage = event => {
         const data = JSON.parse(event.data);
         if (data.type === 'start') {
           // 顯示 AI 回應容器並禁用輸入
           chatDiv.innerHTML += '<div class="message ai"></div>';
           promptInput.disabled = true;
           sendBtn.disabled = true;
         } else if (data.type === 'chunk') {
           // 更新最後一則 AI 回應
           const msgs = chatDiv.querySelectorAll('.message.ai');
           msgs[msgs.length - 1].textContent += data.delta;
           chatDiv.scrollTop = chatDiv.scrollHeight;
         } else if (data.type === 'end') {
           // 回應結束，恢復輸入
           promptInput.disabled = false;
           sendBtn.disabled = false;
         } else if (data.type === 'error') {
           alert('錯誤: ' + data.message);
         }
       };

       sendBtn.onclick = () => {
         const prompt = promptInput.value.trim();
         if (!prompt) return;
         // 顯示使用者訊息
         chatDiv.innerHTML += `<div class="message user">${prompt}</div>`;
         // 傳送 JSON 內容
         ws.send(JSON.stringify({ prompt }));
         promptInput.value = '';
       };
     </script>
   </body>
   </html>
   ```


---

## 通訊協定

- 請使用 WebSocket 連線至 `ws://{host}:{port}`。
- 發送訊息：
  ```json
  { "prompt": "<使用者輸入>" }
  ```
- 接收事件：
  - `{ "type": "start" }`
  - `{ "type": "chunk", "delta": "<回應增量>" }`
  - `{ "type": "end" }`
  - `{ "type": "error", "message": "<錯誤訊息>" }`