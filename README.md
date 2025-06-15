# MCP API Bridge Server

一個 Model Context Protocol (MCP) 伺服器，用於串接 Google Sheets API、Azure AI API 和 MQTT API。

## 功能特色

### 🗃️ Google Sheets API
- 產生新增資料到試算表的程式碼範例
- 產生讀取試算表所有資料的程式碼範例
- 產生更新指定列資料的程式碼範例
- 產生刪除指定列資料的程式碼範例
- 產生覆蓋整張試算表的程式碼範例

### 🤖 Azure AI API
- 產生使用 Azure AI (GPT-4o-mini) 的程式碼範例
- 支援同步和串流模式的程式碼範例
- WebSocket 程式碼實作範例

### 📡 MQTT API
- 建立 IoT 裝置連線
- 發布 MQTT 訊息 (同步/非同步)
- 訂閱 MQTT 主題
- 註冊訊息處理器
- 支援 QoS 等級設定

## 安裝與設定

### 前置需求
- Node.js 18.0.0 或更高版本
- npm 或 yarn
- [Cursor IDE](https://cursor.sh/) (如果要在 Cursor 中使用)

### 🚀 快速安裝 (推薦)

#### 1. 全域安裝 MCP API Bridge

```bash
npm install -g https://github.com/marty5499/mcp-api-bridge.git
```

#### 2. 在 Cursor 中設定 MCP

找到並編輯 Cursor 的 MCP 設定檔案：

**macOS:**
```bash
~/.cursor/mcp.json
```

**Linux:**
```bash
~/.config/cursor/mcp.json
```

**Windows:**
```bash
%APPDATA%\Cursor\mcp.json
```

在設定檔案中加入以下配置：

```json
{
  "mcpServers": {
    "api-bridge": {
      "command": "mcp-api-bridge",
      "env": {}
    }
  }
}
```

#### 3. 重啟 Cursor

重啟 Cursor IDE 使設定生效。

### 🔄 更新到最新版本

當有新版本發布時，使用以下命令更新：

```bash
npm update -g https://github.com/marty5499/mcp-api-bridge.git
```

### 🛠️ 開發者安裝 (本地開發)

如果您想要修改或開發此專案：

1. 複製專案
```bash
git clone https://github.com/marty5499/mcp-api-bridge.git
cd mcp-api-bridge
```

2. 安裝依賴套件
```bash
npm install
```

3. 本地測試
```bash
# 測試工具列表
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node mcp-api-bridge.js

# 啟動開發模式（檔案監控）
npm run dev
```

## 使用方式

### ✅ 驗證安裝

安裝完成後，您可以在 Cursor 中看到 MCP API Bridge 伺服器已連線，並可使用以下 11 個工具：

- **Google Sheets API (5個工具)**：產生 API 操作程式碼範例
- **Azure AI API (1個工具)**：產生 AI 對話程式碼範例  
- **MQTT API (5個工具)**：完整的 IoT 裝置管理功能

### 可用工具

#### Google Sheets API 工具

1. **google_sheet_append** - 產生新增資料的程式碼範例
```json
{
  "url": "https://docs.google.com/spreadsheets/d/your-sheet-id/edit",
  "values": ["張三", "25", "工程師", "2024-01-15"]
}
```

2. **google_sheet_get** - 產生讀取資料的程式碼範例
```json
{
  "url": "https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
}
```

3. **google_sheet_update** - 產生更新資料的程式碼範例
```json
{
  "url": "https://docs.google.com/spreadsheets/d/your-sheet-id/edit",
  "rowIdx": 2,
  "cols": ["李四", "30", "設計師", "2024-01-16"]
}
```

4. **google_sheet_delete** - 產生刪除資料的程式碼範例
```json
{
  "url": "https://docs.google.com/spreadsheets/d/your-sheet-id/edit",
  "rowIdx": 3
}
```

5. **google_sheet_save** - 產生覆蓋資料的程式碼範例
```json
{
  "url": "https://docs.google.com/spreadsheets/d/your-sheet-id/edit",
  "rows": [
    ["姓名", "年齡", "職業", "日期"],
    ["王五", "28", "產品經理", "2024-01-17"]
  ]
}
```

#### Azure AI API 工具

1. **azure_ai_chat** - 產生 Azure AI 程式碼範例
```json
{
  "prompt": "我需要一個聊天機器人的程式碼範例",
  "streaming": false
}
```

#### MQTT API 工具

1. **mqtt_device_create** - 建立裝置
```json
{
  "deviceId": "sensor001"
}
```

2. **mqtt_publish** - 發布訊息
```json
{
  "deviceId": "sensor001",
  "topic": "server001.data",
  "payload": {
    "temperature": 25.5,
    "humidity": 60.2
  },
  "qos": 0
}
```

3. **mqtt_publish_sync** - 同步發布
```json
{
  "deviceId": "client001",
  "topic": "server001.getConfig",
  "payload": {
    "configType": "network"
  },
  "timeout": 10000,
  "qos": 1
}
```

4. **mqtt_register_handler** - 註冊處理器
```json
{
  "deviceId": "server001",
  "action": "data",
  "handlerCode": "const { payload } = message; console.log('處理資料:', payload); return { status: 'ok' };"
}
```

5. **mqtt_subscribe** - 訂閱主題
```json
{
  "deviceId": "monitor001",
  "topic": "alerts/+",
  "qos": 1
}
```

## API 端點資訊

### Google Sheets API
- **基礎 URL**: `https://hshgpt.webduino.tw/api/sheets/`
- **支援操作**: append, get, update, del, save

### Azure AI API  
- **WebSocket URL**: `wss://hshgpt.webduino.tw`
- **協定**: WebSocket 串流通訊

### MQTT API
- **Broker URL**: `wss://mqtt-edu.webduino.io/mqtt`
- **認證**: username: `hsh2025`, password: `hsh2025`

## 實際應用範例

### 1. IoT 資料收集系統

```javascript
// 步驟 1: 建立感測器裝置
await mcp.call('mqtt_device_create', { deviceId: 'temperature_sensor' });

// 步驟 2: 建立資料伺服器
await mcp.call('mqtt_device_create', { deviceId: 'data_server' });

// 步驟 3: 註冊處理器，將資料記錄到 Google Sheets
await mcp.call('mqtt_register_handler', {
  deviceId: 'data_server',
  action: 'logData',
  handlerCode: `
    const { payload } = message;
    // 這裡可以調用 Google Sheets API 記錄資料
    console.log('記錄資料:', payload);
    return { status: 'logged' };
  `
});

// 步驟 4: 感測器發送資料
await mcp.call('mqtt_publish', {
  deviceId: 'temperature_sensor',
  topic: 'data_server.logData',
  payload: {
    temperature: 23.5,
    location: '會議室A',
    timestamp: new Date().toISOString()
  }
});
```

### 2. AI 輔助資料分析

```javascript
// 步驟 1: 讀取試算表資料
const data = await mcp.call('google_sheet_get', {
  url: 'https://docs.google.com/spreadsheets/d/sales-data/edit'
});

// 步驟 2: 產生 Azure AI 分析程式碼
const aiCodeExample = await mcp.call('azure_ai_chat', {
  prompt: '我需要一個分析銷售資料的 AI 程式碼範例',
  streaming: false
});

// 步驟 3: 根據產生的程式碼範例，實作 AI 分析功能
// (這裡需要開發者根據範例程式碼進行實作)
console.log('產生的 AI 程式碼範例:', aiCodeExample.content[0].text);
```

## 錯誤處理

所有工具調用都包含錯誤處理機制：

- **Google Sheets API**: 檢查 URL 格式和 API 回應
- **Azure AI API**: WebSocket 連線錯誤和逾時處理
- **MQTT API**: 連線狀態檢查和裝置管理

## 專案結構

```
mcp-api-bridge/
├── mcp-api-bridge.js     # 主要 MCP 伺服器檔案
├── lib/
│   └── iotDevice.js      # MQTT IoT 裝置類別
├── examples/
│   └── usage-examples.js # 使用範例
├── docs/
│   └── changelog.md      # 變更日誌
├── package.json          # 專案設定
├── .gitignore           # Git 忽略設定
└── README.md            # 專案說明
```

### 📦 GitHub 儲存庫

- **儲存庫 URL**: https://github.com/marty5499/mcp-api-bridge
- **授權**: MIT License
- **語言**: JavaScript (Node.js)

## 開發指南

### 新增工具

1. 在 `setupToolHandlers()` 中定義工具 schema
2. 實作對應的處理函數
3. 新增到 `CallToolRequestSchema` 的 switch 語句中

### 測試

```bash
# 執行範例
node examples/usage-examples.js

# 測試 MCP 伺服器連線
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node mcp-api-bridge.js

# 測試特定工具 (Google Sheets)
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "google_sheet_get", "arguments": {"url": "https://docs.google.com/spreadsheets/d/test/edit"}}}' | node mcp-api-bridge.js

# 測試全域安裝版本
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | mcp-api-bridge
```

### 🔧 疑難排解

#### 問題：Cursor 中看不到 MCP 伺服器
1. 檢查 `~/.cursor/mcp.json` 設定檔案格式是否正確
2. 確認已重啟 Cursor IDE
3. 檢查終端機中是否能執行 `mcp-api-bridge` 命令

#### 問題：工具調用失敗
1. 檢查網路連線狀況
2. 確認 API 端點可正常訪問
3. 查看 MCP 伺服器日誌輸出

#### 問題：更新後功能異常
```bash
# 清除 npm 快取並重新安裝
npm cache clean --force
npm uninstall -g mcp-api-bridge
npm install -g https://github.com/marty5499/mcp-api-bridge.git
```

## 授權

MIT License

## 貢獻

歡迎提交 Issues 和 Pull Requests！

## 更新日誌

### v1.0.2 (2025-01-15)
- 🔧 修正 Google Sheets API 工具功能 - 產生程式碼範例而非直接調用 API
- 🚀 支援全域安裝和 Cursor MCP 配置
- 📖 完整的安裝和配置指南
- 🛠️ 疑難排解和測試指南

### v1.0.1 (2024-01-20)
- 🔧 修正 Azure AI API 工具功能定位
- 📖 更新相關文件和範例

### v1.0.0 (2024-01-20)
- 初始版本發布
- 支援 Google Sheets、Azure AI、MQTT API
- 完整的 MCP 工具實作
- 提供使用範例和文件 