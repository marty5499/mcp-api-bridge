# Cursor MCP 配置指南

## 配置步驟

### 1. 找到 Cursor 的設定檔案

根據您的作業系統，找到 Cursor 的設定目錄：

**macOS:**
```
~/Library/Application Support/Cursor/User/
```

**Linux:**
```
~/.config/cursor/User/
```

**Windows:**
```
%APPDATA%\Cursor\User\
```

### 2. 編輯或建立 MCP 設定檔

在設定目錄中找到或建立 `settings.json` 檔案，並加入以下配置：

```json
{
  "mcp": {
    "mcpServers": {
      "api-bridge": {
        "command": "node",
        "args": ["/Users/sheuyih-shiang/kingkit.codes/2025/mcp-api-bridge/mcp-api-bridge.js"],
        "env": {}
      }
    }
  }
}
```

**注意**: 請將路徑 `/Users/sheuyih-shiang/kingkit.codes/2025/mcp-api-bridge/mcp-api-bridge.js` 替換為您的實際專案路徑。

### 3. 重啟 Cursor

配置完成後，重啟 Cursor 使設定生效。

## 測試 MCP Service

### 1. 檢查 MCP 連線狀態

在 Cursor 中，您應該能看到 MCP 伺服器已連線。

### 2. 測試可用工具

以下是一些測試範例：

#### 🗃️ Google Sheets API 測試

```markdown
請使用 google_sheet_get 工具讀取這個試算表的資料：
https://docs.google.com/spreadsheets/d/your-sheet-id/edit
```

#### 🤖 Azure AI API 測試

```markdown
請使用 azure_ai_chat 工具，產生一個使用 Azure AI 建立智能客服系統的程式碼範例
```

#### 📡 MQTT API 測試

```markdown
請使用以下步驟測試 MQTT：
1. 使用 mqtt_device_create 建立一個名為 "test_device" 的裝置
2. 使用 mqtt_publish 發送一個測試訊息
```

### 3. 驗證所有工具

確認以下 11 個工具都可用：

- ✅ `google_sheet_append` - 新增資料到試算表
- ✅ `google_sheet_get` - 讀取試算表資料
- ✅ `google_sheet_update` - 更新試算表資料
- ✅ `google_sheet_delete` - 刪除試算表資料
- ✅ `google_sheet_save` - 覆蓋試算表資料
- ✅ `azure_ai_chat` - Azure AI 對話
- ✅ `mqtt_device_create` - 建立 MQTT 裝置
- ✅ `mqtt_publish` - 發布 MQTT 訊息
- ✅ `mqtt_publish_sync` - 同步發布 MQTT 訊息
- ✅ `mqtt_register_handler` - 註冊訊息處理器
- ✅ `mqtt_subscribe` - 訂閱 MQTT 主題

## 故障排除

### 常見問題

1. **MCP 伺服器無法啟動**
   - 檢查 Node.js 版本 (需要 18.0.0+)
   - 確認專案路徑正確
   - 檢查依賴套件是否安裝：`npm install`

2. **工具無法使用**
   - 檢查網路連線
   - 確認 API 端點可用
   - 查看 Cursor 的 MCP 錯誤日誌

3. **路徑問題**
   - 使用絕對路徑而非相對路徑
   - 確認檔案權限正確：`chmod +x mcp-api-bridge.js`

### 手動測試 MCP 伺服器

如果遇到問題，可以手動測試：

```bash
# 測試工具列表
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node mcp-api-bridge.js

# 測試工具調用（範例）
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "mqtt_device_create", "arguments": {"deviceId": "test"}}}' | node mcp-api-bridge.js
```

## 實用測試範例

### 完整工作流程測試

建議按照以下順序測試各個功能：

1. **MQTT 基礎功能**
   ```
   建立 MQTT 裝置 → 發布訊息 → 訂閱主題
   ```

2. **Google Sheets 操作**
   ```
   讀取資料 → 新增資料 → 更新資料 → 刪除資料
   ```

3. **Azure AI 對話**
   ```
   簡單問答 → 複雜分析 → 串流對話
   ```

4. **綜合應用**
   ```
   IoT 資料收集 → AI 分析 → 結果記錄到試算表
   ```

## 進階配置

### 環境變數設定

如需自訂設定，可在 `env` 部分加入環境變數：

```json
{
  "mcp": {
    "mcpServers": {
      "api-bridge": {
        "command": "node",
        "args": ["/path/to/mcp-api-bridge.js"],
        "env": {
          "DEBUG": "1",
          "LOG_LEVEL": "info"
        }
      }
    }
  }
}
```

### 多個 MCP 伺服器

您可以同時配置多個 MCP 伺服器：

```json
{
  "mcp": {
    "mcpServers": {
      "api-bridge": {
        "command": "node",
        "args": ["/path/to/mcp-api-bridge.js"]
      },
      "other-server": {
        "command": "python",
        "args": ["/path/to/other-server.py"]
      }
    }
  }
}
```

---

## 支援

如有問題，請檢查：
1. [README.md](./README.md) - 完整專案文件
2. [examples/usage-examples.js](./examples/usage-examples.js) - 使用範例
3. [docs/changelog.md](./docs/changelog.md) - 更新日誌 