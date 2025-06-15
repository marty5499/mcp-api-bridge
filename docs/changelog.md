# 變更日誌 (Changelog)

## [1.0.3] - 2025-06-16

### 新增功能 (Added)
- 🚀 **智能 API 匹配系統**
  - 新增工具別名支援，提供多種呼叫方式
  - 實作模糊匹配功能，支援相似名稱自動識別
  - 建立關鍵字匹配系統，支援中英文關鍵字搜尋
  - 新增字串相似度匹配 (Levenshtein 距離算法)

### 改善 (Improved)
- 🎯 **提升 API 發現準確性**
  - 支援別名調用：如 `sheet_add` → `google_sheet_append`
  - 關鍵字智能匹配：如 `新增` → `google_sheet_append`
  - 模糊字串匹配：如 `google_sheet_add` → `google_sheet_append`
  - 多語言支援：中文關鍵字匹配 (新增、讀取、更新、刪除等)

- 🔧 **改善錯誤處理機制**
  - 當工具名稱不匹配時，提供智能建議
  - 顯示匹配信心度和匹配原因
  - 提供多個相似工具選項
  - 包含工具描述和功能說明

- 📊 **工具分類系統**
  - Google Sheets 操作類別
  - Azure AI 服務類別
  - MQTT/IoT 設備類別
  - 每個工具包含操作類型標籤

### 技術實作 (Technical Implementation)
- 建立 `toolMetadata` 系統，包含：
  - 別名映射 (`aliasMap`)
  - 關鍵字索引 (`keywordMap`)
  - 工具分類和操作類型
- 實作 Levenshtein 距離算法進行字串相似度計算
- 新增 `findBestMatches()` 方法，支援多種匹配策略
- 改進 `CallToolRequestSchema` 處理流程
- 新增智能路由機制，自動選擇最佳匹配工具

### 別名對照表
```
Google Sheets:
- google_sheet_append → sheet_add, sheet_append, google_sheet_add
- google_sheet_get → sheet_get, sheet_read, google_sheet_read
- google_sheet_update → sheet_update, sheet_edit, google_sheet_modify
- google_sheet_delete → sheet_delete, sheet_remove, google_sheet_remove
- google_sheet_save → sheet_save, sheet_replace, google_sheet_overwrite

Azure AI:
- azure_ai_chat → ai_chat, gpt_chat, azure_ai, openai_chat

MQTT:
- mqtt_device_create → mqtt_create, iot_device_create, device_create
- mqtt_publish → mqtt_send, iot_publish, device_publish
- mqtt_publish_sync → mqtt_send_sync, mqtt_request, iot_publish_sync
- mqtt_register_handler → mqtt_handler, mqtt_callback, iot_handler
- mqtt_subscribe → mqtt_listen, iot_subscribe, device_subscribe
```

### 支援的關鍵字
- **中文**: 新增、添加、插入、讀取、查詢、獲取、更新、修改、編輯、刪除、移除、儲存、覆蓋、對話、聊天、人工智慧、建立、創建、裝置、物聯網、發布、發送、傳送、訊息、同步發布、註冊、處理器、回調、事件、訂閱、監聽、接收
- **英文**: append, add, insert, get, read, fetch, update, modify, edit, delete, remove, save, overwrite, replace, chat, ai, gpt, azure, create, device, iot, mqtt, publish, send, message, sync, request, response, handler, callback, register, subscribe, listen, receive

---

## [1.0.2] - 2025-06-15

### 重大修正 (Fixed)
- 🔧 **修正 Google Sheets API 工具功能定位**
  - 所有 Google Sheets API 工具現在產生程式碼範例，而不是直接調用 API
  - `google_sheet_append` - 產生新增資料的完整程式碼範例
  - `google_sheet_get` - 產生讀取資料的完整程式碼範例  
  - `google_sheet_update` - 產生更新資料的完整程式碼範例
  - `google_sheet_delete` - 產生刪除資料的完整程式碼範例
  - `google_sheet_save` - 產生覆蓋資料的完整程式碼範例
- 📖 更新工具描述，明確說明是產生程式碼範例
- 🛠️ 修正 README.md 中的工具說明

### 改善 (Improved)
- 程式碼範例包含完整的錯誤處理和回應處理
- 每個範例都包含詳細的註解說明
- 提供可直接執行的程式碼結構
- 統一的工具行為邏輯

---

## [1.0.1] - 2024-01-20

### 修正 (Fixed)
- 🔧 修正 Azure AI API 工具功能定位
  - `azure_ai_chat` 現在產生程式碼範例，而不是直接調用 API
  - 更新工具描述和參數說明
  - 提供同步和串流兩種程式碼範例
- 📖 更新相關文件和範例

### 改善 (Improved)
- 更清楚的工具功能說明
- 更實用的程式碼範例輸出
- 統一的工具行為邏輯

---

## [1.0.0] - 2024-01-20

### 新增功能 (Added)
- 🎉 初始版本發布
- 建立完整的 MCP (Model Context Protocol) 伺服器架構
- 串接 Google Sheets API，支援完整的 CRUD 操作
  - `google_sheet_append`: 新增資料到試算表
  - `google_sheet_get`: 讀取試算表所有資料
  - `google_sheet_update`: 更新指定列資料
  - `google_sheet_delete`: 刪除指定列資料
  - `google_sheet_save`: 覆蓋整張試算表
- 串接 Azure AI (GPT-4o-mini) API
  - `azure_ai_chat`: 支援同步和串流對話模式
  - WebSocket 即時通訊機制
- 完整的 MQTT API 整合
  - `mqtt_device_create`: 建立 IoT 裝置連線
  - `mqtt_publish`: 非同步發布訊息
  - `mqtt_publish_sync`: 同步發布訊息並等待回應
  - `mqtt_register_handler`: 註冊訊息處理器
  - `mqtt_subscribe`: 訂閱 MQTT 主題
- 使用 Node.js ES6 模組系統 (import/export)
- 完整的錯誤處理機制

### 技術實作 (Technical Implementation)
- 使用 `@modelcontextprotocol/sdk` 建立 MCP 伺服器
- 整合 `node-fetch` 處理 HTTP API 請求
- 使用 `ws` 套件處理 WebSocket 通訊
- 使用 `mqtt` 套件處理 MQTT 協定
- 使用 `uuid` 產生唯一識別碼

### 文件 (Documentation)
- 📖 建立完整的 README.md，包含：
  - 功能特色說明
  - 安裝和設定指南
  - 詳細的 API 使用方式
  - 實際應用範例
  - 錯誤處理說明
  - 開發指南
- 📝 建立 `examples/usage-examples.js`，提供：
  - 各 API 的使用範例
  - 綜合應用情境
  - 最佳實作參考
- 🔧 設定 `package.json`，包含：
  - 專案依賴套件
  - 執行腳本
  - ES 模組設定

### 架構設計 (Architecture)
- 採用模組化設計，將功能分為三大類：
  1. Google Sheets API 處理器
  2. Azure AI API 處理器  
  3. MQTT API 處理器
- IoTDevice 類別封裝 MQTT 操作
- 統一的錯誤處理和回應格式
- 支援並發 MQTT 裝置管理

### API 端點配置
- **Google Sheets API**: `https://hshgpt.webduino.tw/api/sheets/`
- **Azure AI API**: `wss://hshgpt.webduino.tw` (WebSocket)
- **MQTT Broker**: `wss://mqtt-edu.webduino.io/mqtt`
  - 使用者名稱: `hsh2025`
  - 密碼: `hsh2025`

### 檔案結構
```
mcp-api-bridge/
├── mcp-api-bridge.js       # 主要 MCP 伺服器
├── lib/iotDevice.js        # MQTT IoT 裝置類別 (已更新為 Node.js 相容)
├── examples/usage-examples.js  # 使用範例
├── docs/changelog.md       # 變更日誌
├── package.json           # 專案設定
└── README.md             # 專案文件
```

### 修改內容
- 更新 `lib/iotDevice.js` 以支援 Node.js 環境
  - 將 `https://jspm.dev/uuid` 改為本地 `uuid` 套件
  - 新增 `mqtt` 套件 import
- 建立完整的 MCP 工具定義和處理邏輯
- 實作所有 API 的串接功能

### 待實作功能 (Future Enhancements)
- 新增單元測試
- 實作設定檔案支援
- 新增日誌記錄功能
- 支援其他 MQTT broker
- 新增更多 AI 模型支援

---

## 專案建立日期
**2024-01-20** - 完成初始版本，包含完整的 MCP 伺服器實作和文件 