#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import { IoTDevice } from './lib/iotDevice.js';

class ApiMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'api-bridge-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 初始化工具元數據
    this.initializeToolMetadata();
    this.setupToolHandlers();
  }

  // 工具元數據定義
  initializeToolMetadata() {
    this.toolMetadata = {
      'google_sheet_append': {
        aliases: ['google_sheet_add', 'google_sheet_insert', 'sheet_append', 'sheet_add'],
        keywords: ['新增', '添加', '插入', '試算表', 'spreadsheet', 'append', 'add', 'insert'],
        category: 'google_sheets',
        operation: 'create'
      },
      'google_sheet_get': {
        aliases: ['google_sheet_read', 'google_sheet_fetch', 'sheet_get', 'sheet_read'],
        keywords: ['讀取', '查詢', '獲取', '取得', '試算表', 'spreadsheet', 'get', 'read', 'fetch'],
        category: 'google_sheets',
        operation: 'read'
      },
      'google_sheet_update': {
        aliases: ['google_sheet_modify', 'google_sheet_edit', 'sheet_update', 'sheet_edit'],
        keywords: ['更新', '修改', '編輯', '試算表', 'spreadsheet', 'update', 'modify', 'edit'],
        category: 'google_sheets',
        operation: 'update'
      },
      'google_sheet_delete': {
        aliases: ['google_sheet_remove', 'sheet_delete', 'sheet_remove'],
        keywords: ['刪除', '移除', '試算表', 'spreadsheet', 'delete', 'remove'],
        category: 'google_sheets',
        operation: 'delete'
      },
      'google_sheet_save': {
        aliases: ['google_sheet_overwrite', 'sheet_save', 'sheet_replace'],
        keywords: ['儲存', '覆蓋', '取代', '試算表', 'spreadsheet', 'save', 'overwrite', 'replace'],
        category: 'google_sheets',
        operation: 'save'
      },
      'azure_ai_chat': {
        aliases: ['azure_ai', 'ai_chat', 'gpt_chat', 'openai_chat'],
        keywords: ['對話', '聊天', '人工智慧', 'ai', 'chat', 'gpt', 'azure', '問答'],
        category: 'ai_services',
        operation: 'chat'
      },
      'mqtt_device_create': {
        aliases: ['mqtt_create', 'iot_device_create', 'device_create'],
        keywords: ['建立', '創建', '裝置', '物聯網', 'mqtt', 'iot', 'device', 'create'],
        category: 'iot',
        operation: 'create'
      },
      'mqtt_publish': {
        aliases: ['mqtt_send', 'iot_publish', 'device_publish'],
        keywords: ['發布', '發送', '傳送', '訊息', 'mqtt', 'publish', 'send', 'message'],
        category: 'iot',
        operation: 'publish'
      },
      'mqtt_publish_sync': {
        aliases: ['mqtt_send_sync', 'mqtt_request', 'iot_publish_sync'],
        keywords: ['同步發布', '同步發送', '等待回應', 'mqtt', 'sync', 'request', 'response'],
        category: 'iot',
        operation: 'publish_sync'
      },
      'mqtt_register_handler': {
        aliases: ['mqtt_handler', 'mqtt_callback', 'iot_handler'],
        keywords: ['註冊', '處理器', '回調', '事件', 'mqtt', 'handler', 'callback', 'register'],
        category: 'iot',
        operation: 'register'
      },
      'mqtt_subscribe': {
        aliases: ['mqtt_listen', 'iot_subscribe', 'device_subscribe'],
        keywords: ['訂閱', '監聽', '接收', 'mqtt', 'subscribe', 'listen', 'receive'],
        category: 'iot',
        operation: 'subscribe'
      }
    };

    // 建立反向索引以便快速查找
    this.aliasMap = new Map();
    this.keywordMap = new Map();
    
    for (const [toolName, metadata] of Object.entries(this.toolMetadata)) {
      // 建立別名映射
      for (const alias of metadata.aliases) {
        this.aliasMap.set(alias.toLowerCase(), toolName);
      }
      
      // 建立關鍵字映射
      for (const keyword of metadata.keywords) {
        if (!this.keywordMap.has(keyword.toLowerCase())) {
          this.keywordMap.set(keyword.toLowerCase(), []);
        }
        this.keywordMap.get(keyword.toLowerCase()).push(toolName);
      }
    }
  }

  // 模糊匹配功能
  findBestMatches(input, maxSuggestions = 5) {
    const inputLower = input.toLowerCase();
    const matches = [];

    // 1. 精確匹配工具名稱
    if (this.toolMetadata[input]) {
      return [{ tool: input, confidence: 1.0, reason: '精確匹配' }];
    }

    // 2. 別名匹配
    if (this.aliasMap.has(inputLower)) {
      const toolName = this.aliasMap.get(inputLower);
      matches.push({ tool: toolName, confidence: 0.95, reason: '別名匹配' });
    }

    // 3. 關鍵字匹配
    for (const [keyword, tools] of this.keywordMap) {
      if (keyword.includes(inputLower) || inputLower.includes(keyword)) {
        for (const tool of tools) {
          const confidence = this.calculateKeywordConfidence(inputLower, keyword);
          matches.push({ tool, confidence, reason: `關鍵字匹配: ${keyword}` });
        }
      }
    }

    // 4. 模糊字串匹配
    for (const toolName of Object.keys(this.toolMetadata)) {
      const similarity = this.calculateStringSimilarity(inputLower, toolName.toLowerCase());
      if (similarity > 0.4) {
        matches.push({ tool: toolName, confidence: similarity * 0.8, reason: '字串相似度匹配' });
      }
    }

    // 去重並排序
    const uniqueMatches = new Map();
    for (const match of matches) {
      if (!uniqueMatches.has(match.tool) || uniqueMatches.get(match.tool).confidence < match.confidence) {
        uniqueMatches.set(match.tool, match);
      }
    }

    return Array.from(uniqueMatches.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);
  }

  // 計算關鍵字匹配置信度
  calculateKeywordConfidence(input, keyword) {
    if (input === keyword) return 0.9;
    if (input.includes(keyword) || keyword.includes(input)) return 0.7;
    return 0.5;
  }

  // 計算字串相似度 (簡化版 Levenshtein 距離)
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein 距離計算
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // 生成建議訊息
  generateSuggestionMessage(originalTool, matches) {
    if (matches.length === 0) {
      return `未找到工具 "${originalTool}"。\n\n可用的工具類別包括：\n• Google Sheets 操作 (google_sheet_*)\n• Azure AI 對話 (azure_ai_chat)\n• MQTT 物聯網 (mqtt_*)`;
    }

    let message = `未找到精確匹配的工具 "${originalTool}"。\n\n以下是相似的工具建議：\n`;
    
    for (let i = 0; i < Math.min(matches.length, 3); i++) {
      const match = matches[i];
      const metadata = this.toolMetadata[match.tool];
      message += `\n${i + 1}. **${match.tool}** (信心度: ${(match.confidence * 100).toFixed(0)}%)\n`;
      message += `   原因: ${match.reason}\n`;
      message += `   描述: ${this.getToolDescription(match.tool)}\n`;
    }

    return message;
  }

  // 獲取工具描述
  getToolDescription(toolName) {
    const descriptions = {
      'google_sheet_append': '新增一列資料到 Google 試算表',
      'google_sheet_get': '讀取 Google 試算表的所有資料',
      'google_sheet_update': '更新 Google 試算表指定列的資料',
      'google_sheet_delete': '刪除 Google 試算表指定列的資料',
      'google_sheet_save': '覆蓋整張 Google 試算表的資料',
      'azure_ai_chat': '使用 Azure AI 進行對話互動',
      'mqtt_device_create': '建立 MQTT IoT 裝置連線',
      'mqtt_publish': '發布 MQTT 訊息到指定主題',
      'mqtt_publish_sync': '同步發布 MQTT 訊息並等待回應',
      'mqtt_register_handler': '註冊 MQTT 訊息處理器',
      'mqtt_subscribe': '訂閱 MQTT 主題以接收訊息'
    };
    return descriptions[toolName] || '無描述';
  }

  // 精確匹配工具名稱（包括別名）
  getExactToolMatch(input) {
    // 檢查是否為正式工具名稱
    if (this.toolMetadata[input]) {
      return input;
    }
    
    // 檢查是否為別名
    const aliasMatch = this.aliasMap.get(input.toLowerCase());
    if (aliasMatch) {
      return aliasMatch;
    }
    
    return null;
  }

  // 根據工具名稱執行對應的處理器
  async executeToolByName(toolName, args) {
    switch (toolName) {
      // Google Sheet API 相關工具
      case 'google_sheet_append':
        return await this.handleGoogleSheetAppend(args);
      case 'google_sheet_get':
        return await this.handleGoogleSheetGet(args);
      case 'google_sheet_update':
        return await this.handleGoogleSheetUpdate(args);
      case 'google_sheet_delete':
        return await this.handleGoogleSheetDelete(args);
      case 'google_sheet_save':
        return await this.handleGoogleSheetSave(args);

      // Azure AI API 相關工具
      case 'azure_ai_chat':
        return await this.handleAzureAiChat(args);

      // MQTT API 相關工具
      case 'mqtt_device_create':
        return await this.handleMqttDeviceCreate(args);
      case 'mqtt_publish':
        return await this.handleMqttPublish(args);
      case 'mqtt_publish_sync':
        return await this.handleMqttPublishSync(args);
      case 'mqtt_register_handler':
        return await this.handleMqttRegisterHandler(args);
      case 'mqtt_subscribe':
        return await this.handleMqttSubscribe(args);

      default:
        throw new Error(`內部錯誤：未知的工具 "${toolName}"`);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Google Sheet API Tools
          {
            name: 'google_sheet_append',
            description: '產生使用 Google Sheets API 新增一列資料的程式碼範例',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '試算表完整 URL'
                },
                values: {
                  type: 'array',
                  description: '欄位值陣列，如 ["aaa","bbb","ccc"]',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: ['url', 'values'],
            },
          },
          {
            name: 'google_sheet_get',
            description: '產生使用 Google Sheets API 讀取所有資料的程式碼範例',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '試算表 URL'
                }
              },
              required: ['url'],
            },
          },
          {
            name: 'google_sheet_update',
            description: '產生使用 Google Sheets API 更新指定列資料的程式碼範例',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '試算表 URL'
                },
                rowIdx: {
                  type: 'number',
                  description: '1-based 列號'
                },
                cols: {
                  type: 'array',
                  description: '欄位值陣列',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: ['url', 'rowIdx', 'cols'],
            },
          },
          {
            name: 'google_sheet_delete',
            description: '產生使用 Google Sheets API 刪除指定列資料的程式碼範例',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '試算表 URL'
                },
                rowIdx: {
                  type: 'number',
                  description: '1-based 列號'
                }
              },
              required: ['url', 'rowIdx'],
            },
          },
          {
            name: 'google_sheet_save',
            description: '產生使用 Google Sheets API 覆蓋整張試算表的程式碼範例',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: '試算表 URL'
                },
                rows: {
                  type: 'array',
                  description: '二維陣列格式的新資料',
                  items: {
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  }
                }
              },
              required: ['url', 'rows'],
            },
          },

          // Azure AI API Tools
          {
            name: 'azure_ai_chat',
            description: '產生使用 Azure AI (GPT-4o-mini) 的程式碼範例',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: '描述需要什麼樣的 Azure AI 使用範例'
                },
                streaming: {
                  type: 'boolean',
                  description: '是否需要串流模式的程式碼範例 (預設: false)',
                  default: false
                }
              },
              required: ['prompt'],
            },
          },

          // MQTT API Tools
          {
            name: 'mqtt_device_create',
            description: '建立 MQTT IoT 裝置連線',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: '裝置邏輯 ID'
                }
              },
              required: ['deviceId'],
            },
          },
          {
            name: 'mqtt_publish',
            description: '發布 MQTT 訊息',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: '發送方裝置 ID'
                },
                topic: {
                  type: 'string',
                  description: '目標裝置ID.動作，如 "targetDevice.action"'
                },
                payload: {
                  type: 'object',
                  description: '訊息內容'
                },
                qos: {
                  type: 'number',
                  description: 'QoS 等級 (預設: 0)',
                  default: 0
                }
              },
              required: ['deviceId', 'topic', 'payload'],
            },
          },
          {
            name: 'mqtt_publish_sync',
            description: '同步發布 MQTT 訊息並等待回應',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: '發送方裝置 ID'
                },
                topic: {
                  type: 'string',
                  description: '目標裝置ID.動作，如 "targetDevice.action"'
                },
                payload: {
                  type: 'object',
                  description: '訊息內容'
                },
                timeout: {
                  type: 'number',
                  description: '逾時時間 (毫秒，預設: 5000)',
                  default: 5000
                },
                qos: {
                  type: 'number',
                  description: 'QoS 等級 (預設: 0)',
                  default: 0
                }
              },
              required: ['deviceId', 'topic', 'payload'],
            },
          },
          {
            name: 'mqtt_register_handler',
            description: '註冊 MQTT 訊息處理器',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: '裝置 ID'
                },
                action: {
                  type: 'string',
                  description: '要處理的動作名稱'
                },
                handlerCode: {
                  type: 'string',
                  description: '處理器函數程式碼 (JavaScript)'
                }
              },
              required: ['deviceId', 'action', 'handlerCode'],
            },
          },
          {
            name: 'mqtt_subscribe',
            description: '訂閱 MQTT 主題',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: '裝置 ID'
                },
                topic: {
                  type: 'string',
                  description: '要訂閱的主題'
                },
                qos: {
                  type: 'number',
                  description: 'QoS 等級 (預設: 0)',
                  default: 0
                }
              },
              required: ['deviceId', 'topic'],
            },
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // 首先嘗試精確匹配
        const exactMatch = this.getExactToolMatch(name);
        if (exactMatch) {
          return await this.executeToolByName(exactMatch, args);
        }

        // 如果沒有精確匹配，進行模糊匹配
        const matches = this.findBestMatches(name);
        
        if (matches.length > 0 && matches[0].confidence > 0.8) {
          // 如果最佳匹配的信心度很高，直接執行
          return await this.executeToolByName(matches[0].tool, args);
        } else {
          // 否則提供建議
          const suggestionMessage = this.generateSuggestionMessage(name, matches);
          throw new Error(suggestionMessage);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  // MQTT 裝置管理
  mqttDevices = new Map();

  // Google Sheet API 處理器
  async handleGoogleSheetAppend(args) {
    const { url, values } = args;
    
    const codeExample = `// Google Sheets API - 新增一列資料範例
// API 端點: https://hshgpt.webduino.tw/api/sheets/append

const fetch = require('node-fetch'); // 或使用 import fetch from 'node-fetch';

async function appendToGoogleSheet() {
  const apiUrl = 'https://hshgpt.webduino.tw/api/sheets/append';
  
  const requestBody = {
    url: '${url}',
    values: ${JSON.stringify(values)}
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('資料新增成功:', result.data);
      return result;
    } else {
      console.error('資料新增失敗:', result);
      return null;
    }
  } catch (error) {
    console.error('API 呼叫錯誤:', error);
    throw error;
  }
}

// 呼叫函數
appendToGoogleSheet()
  .then(result => {
    if (result) {
      console.log('新增操作完成');
    }
  })
  .catch(error => {
    console.error('操作失敗:', error);
  });`;
    
    return {
      content: [
        {
          type: 'text',
          text: `以下是使用 Google Sheets API 新增資料的程式碼範例：\n\n\`\`\`javascript\n${codeExample}\n\`\`\``,
        },
      ],
    };
  }

  async handleGoogleSheetGet(args) {
    const { url } = args;
    
    const codeExample = `// Google Sheets API - 讀取所有資料範例
// API 端點: https://hshgpt.webduino.tw/api/sheets/get

const fetch = require('node-fetch'); // 或使用 import fetch from 'node-fetch';

async function getGoogleSheetData() {
  const apiUrl = \`https://hshgpt.webduino.tw/api/sheets/get?url=\${encodeURIComponent('${url}')}\`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('讀取資料成功，共', result.rows.length, '筆資料');
      console.log('資料內容:', result.rows);
      
      // 處理每一列資料
      result.rows.forEach((row, index) => {
        console.log(\`第 \${index + 1} 列:\`, row);
      });
      
      return result.rows;
    } else {
      console.error('讀取資料失敗:', result);
      return null;
    }
  } catch (error) {
    console.error('API 呼叫錯誤:', error);
    throw error;
  }
}

// 呼叫函數
getGoogleSheetData()
  .then(data => {
    if (data) {
      console.log('讀取操作完成，資料筆數:', data.length);
    }
  })
  .catch(error => {
    console.error('操作失敗:', error);
  });`;
    
    return {
      content: [
        {
          type: 'text',
          text: `以下是使用 Google Sheets API 讀取資料的程式碼範例：\n\n\`\`\`javascript\n${codeExample}\n\`\`\``,
        },
      ],
    };
  }

  async handleGoogleSheetUpdate(args) {
    const { url, rowIdx, cols } = args;
    
    const codeExample = `// Google Sheets API - 更新指定列資料範例
// API 端點: https://hshgpt.webduino.tw/api/sheets/update

const fetch = require('node-fetch'); // 或使用 import fetch from 'node-fetch';

async function updateGoogleSheetRow() {
  const apiUrl = 'https://hshgpt.webduino.tw/api/sheets/update';
  
  const requestBody = {
    url: '${url}',
    rowIdx: ${rowIdx}, // 1-based 列號 (第 ${rowIdx} 列)
    cols: ${JSON.stringify(cols)}
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(\`第 \${requestBody.rowIdx} 列資料更新成功\`);
      console.log('更新結果:', result.result);
      return result;
    } else {
      console.error('資料更新失敗:', result);
      return null;
    }
  } catch (error) {
    console.error('API 呼叫錯誤:', error);
    throw error;
  }
}

// 呼叫函數
updateGoogleSheetRow()
  .then(result => {
    if (result) {
      console.log('更新操作完成');
    }
  })
  .catch(error => {
    console.error('操作失敗:', error);
  });`;
    
    return {
      content: [
        {
          type: 'text',
          text: `以下是使用 Google Sheets API 更新資料的程式碼範例：\n\n\`\`\`javascript\n${codeExample}\n\`\`\``,
        },
      ],
    };
  }

  async handleGoogleSheetDelete(args) {
    const { url, rowIdx } = args;
    
    const codeExample = `// Google Sheets API - 刪除指定列資料範例
// API 端點: https://hshgpt.webduino.tw/api/sheets/del

const fetch = require('node-fetch'); // 或使用 import fetch from 'node-fetch';

async function deleteGoogleSheetRow() {
  const apiUrl = 'https://hshgpt.webduino.tw/api/sheets/del';
  
  const requestBody = {
    url: '${url}',
    rowIdx: ${rowIdx} // 1-based 列號 (第 ${rowIdx} 列)
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(\`第 \${requestBody.rowIdx} 列資料刪除成功\`);
      console.log('刪除結果:', result.result);
      return result;
    } else {
      console.error('資料刪除失敗:', result);
      return null;
    }
  } catch (error) {
    console.error('API 呼叫錯誤:', error);
    throw error;
  }
}

// 呼叫函數 (請確認要刪除的列號)
deleteGoogleSheetRow()
  .then(result => {
    if (result) {
      console.log('刪除操作完成');
    }
  })
  .catch(error => {
    console.error('操作失敗:', error);
  });`;
    
    return {
      content: [
        {
          type: 'text',
          text: `以下是使用 Google Sheets API 刪除資料的程式碼範例：\n\n\`\`\`javascript\n${codeExample}\n\`\`\``,
        },
      ],
    };
  }

  async handleGoogleSheetSave(args) {
    const { url, rows } = args;
    
    const codeExample = `// Google Sheets API - 覆蓋整張試算表範例
// API 端點: https://hshgpt.webduino.tw/api/sheets/save

const fetch = require('node-fetch'); // 或使用 import fetch from 'node-fetch';

async function saveGoogleSheetData() {
  const apiUrl = 'https://hshgpt.webduino.tw/api/sheets/save';
  
  const requestBody = {
    url: '${url}',
    rows: ${JSON.stringify(rows, null, 2)}
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('試算表資料覆蓋成功');
      console.log(\`新資料共 \${requestBody.rows.length} 列\`);
      console.log('操作結果:', result.result);
      return result;
    } else {
      console.error('資料覆蓋失敗:', result);
      return null;
    }
  } catch (error) {
    console.error('API 呼叫錯誤:', error);
    throw error;
  }
}

// 呼叫函數 (注意：這會完全覆蓋試算表原有資料)
saveGoogleSheetData()
  .then(result => {
    if (result) {
      console.log('覆蓋操作完成');
    }
  })
  .catch(error => {
    console.error('操作失敗:', error);
  });`;
    
    return {
      content: [
        {
          type: 'text',
          text: `以下是使用 Google Sheets API 覆蓋資料的程式碼範例：\n\n\`\`\`javascript\n${codeExample}\n\`\`\``
        },
      ],
    };
  }

  // Azure AI API 處理器
  async handleAzureAiChat(args) {
    const { prompt, streaming = false } = args;
    
    if (streaming) {
      return this.generateAzureAiStreamingExample(prompt);
    } else {
      return this.generateAzureAiSyncExample(prompt);
    }
  }

  generateAzureAiSyncExample(requirement) {
    const syncExample = `
// Azure AI 同步調用範例
// 需求: ${requirement}

const WebSocket = require('ws');

async function callAzureAI(prompt) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://hshgpt.webduino.tw');
    let response = '';
    
    ws.on('open', () => {
      console.log('WebSocket 連線已建立');
      ws.send(JSON.stringify({ prompt }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'start') {
        console.log('AI 開始回應...');
      } else if (message.type === 'chunk') {
        response += message.delta;
        // 可以在這裡處理即時回應
      } else if (message.type === 'end') {
        console.log('AI 回應完成');
        ws.close();
        resolve(response);
      } else if (message.type === 'error') {
        console.error('AI 回應錯誤:', message.message);
        ws.close();
        reject(new Error(message.message));
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket 錯誤:', error);
      reject(error);
    });

    // 30秒逾時
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        reject(new Error('請求逾時'));
      }
    }, 30000);
  });
}

// 使用範例
async function main() {
  try {
    const result = await callAzureAI('${requirement}');
    console.log('AI 回應:', result);
  } catch (error) {
    console.error('錯誤:', error.message);
  }
}

main();
`;

    return {
      content: [
        {
          type: 'text',
          text: `Azure AI 同步調用程式碼範例:\n\`\`\`javascript${syncExample}\`\`\``,
        },
      ],
    };
  }

  generateAzureAiStreamingExample(requirement) {
    const streamingExample = `
// Azure AI 串流調用範例（前端網頁版）
// 需求: ${requirement}

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Azure AI 串流對話</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    #chat { 
      white-space: pre-wrap; 
      border: 1px solid #ccc; 
      padding: 10px; 
      max-height: 300px; 
      overflow-y: auto; 
      margin-bottom: 10px; 
    }
    .message.user { color: #0063b1; margin-bottom: 5px; }
    .message.ai { color: #333; margin-bottom: 5px; }
    #prompt { width: 70%; padding: 5px; }
    button { padding: 5px 10px; }
  </style>
</head>
<body>
  <div id="chat"></div>
  <input id="prompt" type="text" placeholder="輸入您的問題..." />
  <button id="sendBtn">送出</button>
  
  <script>
    const ws = new WebSocket('wss://hshgpt.webduino.tw');
    const chatDiv = document.getElementById('chat');
    const promptInput = document.getElementById('prompt');
    const sendBtn = document.getElementById('sendBtn');

    ws.onopen = () => {
      console.log('WebSocket 已連線');
      chatDiv.innerHTML += '系統: WebSocket 連線成功\\n';
    };
    
    ws.onerror = err => {
      console.error('WebSocket 錯誤', err);
      chatDiv.innerHTML += '系統: 連線錯誤\\n';
    };
    
    ws.onclose = () => {
      console.log('WebSocket 已斷線');
      chatDiv.innerHTML += '系統: 連線已斷開\\n';
    };

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'start') {
        // 開始接收 AI 回應
        chatDiv.innerHTML += '<div class="message ai"></div>';
        promptInput.disabled = true;
        sendBtn.disabled = true;
      } else if (data.type === 'chunk') {
        // 更新最後一則 AI 回應
        const msgs = chatDiv.querySelectorAll('.message.ai');
        msgs[msgs.length - 1].textContent += data.delta;
        chatDiv.scrollTop = chatDiv.scrollHeight;
      } else if (data.type === 'end') {
        // 回應結束
        promptInput.disabled = false;
        sendBtn.disabled = false;
        promptInput.focus();
      } else if (data.type === 'error') {
        alert('錯誤: ' + data.message);
        promptInput.disabled = false;
        sendBtn.disabled = false;
      }
    };

    sendBtn.onclick = () => {
      const prompt = promptInput.value.trim();
      if (!prompt) return;
      
      // 顯示使用者訊息
      chatDiv.innerHTML += \`<div class="message user">使用者: \${prompt}</div>\`;
      
      // 發送到 Azure AI
      ws.send(JSON.stringify({ prompt }));
      promptInput.value = '';
      chatDiv.scrollTop = chatDiv.scrollHeight;
    };

    // Enter 鍵送出
    promptInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
  </script>
</body>
</html>

// Node.js 版串流處理
const WebSocket = require('ws');

function streamAzureAI(prompt, onChunk, onComplete, onError) {
  const ws = new WebSocket('wss://hshgpt.webduino.tw');
  
  ws.on('open', () => {
    ws.send(JSON.stringify({ prompt }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'chunk') {
      onChunk(message.delta);
    } else if (message.type === 'end') {
      ws.close();
      onComplete();
    } else if (message.type === 'error') {
      ws.close();
      onError(new Error(message.message));
    }
  });

  ws.on('error', onError);
}

// 使用範例
streamAzureAI(
  '${requirement}',
  (chunk) => process.stdout.write(chunk), // 即時輸出
  () => console.log('\\n完成'),
  (error) => console.error('錯誤:', error)
);
`;

    return {
      content: [
        {
          type: 'text',
          text: `Azure AI 串流調用程式碼範例:\n\`\`\`html${streamingExample}\`\`\``,
        },
      ],
    };
  }

  // MQTT API 處理器
  async handleMqttDeviceCreate(args) {
    const { deviceId } = args;
    
    if (this.mqttDevices.has(deviceId)) {
      return {
        content: [
          {
            type: 'text',
            text: `MQTT 裝置 ${deviceId} 已存在`,
          },
        ],
      };
    }

    const device = new IoTDevice(deviceId);
    
    try {
      await device.connect();
      this.mqttDevices.set(deviceId, device);
      
      return {
        content: [
          {
            type: 'text',
            text: `MQTT 裝置 ${deviceId} 已成功建立並連線`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`建立 MQTT 裝置失敗: ${error.message}`);
    }
  }

  async handleMqttPublish(args) {
    const { deviceId, topic, payload, qos = 0 } = args;
    
    const device = this.mqttDevices.get(deviceId);
    if (!device) {
      throw new Error(`MQTT 裝置 ${deviceId} 不存在，請先建立裝置`);
    }

    device.pub(topic, payload, qos);
    
    return {
      content: [
        {
          type: 'text',
          text: `MQTT 訊息已發布:\n裝置: ${deviceId}\n主題: ${topic}\n內容: ${JSON.stringify(payload, null, 2)}`,
        },
      ],
    };
  }

  async handleMqttPublishSync(args) {
    const { deviceId, topic, payload, timeout = 5000, qos = 0 } = args;
    
    const device = this.mqttDevices.get(deviceId);
    if (!device) {
      throw new Error(`MQTT 裝置 ${deviceId} 不存在，請先建立裝置`);
    }

    try {
      const response = await device.pubSync(topic, payload, timeout, qos);
      
      return {
        content: [
          {
            type: 'text',
            text: `MQTT 同步訊息回應:\n裝置: ${deviceId}\n主題: ${topic}\n回應: ${JSON.stringify(response, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`MQTT 同步訊息失敗: ${error.message}`);
    }
  }

  async handleMqttRegisterHandler(args) {
    const { deviceId, action, handlerCode } = args;
    
    const device = this.mqttDevices.get(deviceId);
    if (!device) {
      throw new Error(`MQTT 裝置 ${deviceId} 不存在，請先建立裝置`);
    }

    try {
      // 建立處理器函數
      const handler = new Function('message', handlerCode);
      device.proc(action, handler);
      
      return {
        content: [
          {
            type: 'text',
            text: `MQTT 處理器已註冊:\n裝置: ${deviceId}\n動作: ${action}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`註冊 MQTT 處理器失敗: ${error.message}`);
    }
  }

  async handleMqttSubscribe(args) {
    const { deviceId, topic, qos = 0 } = args;
    
    const device = this.mqttDevices.get(deviceId);
    if (!device) {
      throw new Error(`MQTT 裝置 ${deviceId} 不存在，請先建立裝置`);
    }

    try {
      await device.subscribe(topic, qos);
      
      return {
        content: [
          {
            type: 'text',
            text: `MQTT 主題訂閱成功:\n裝置: ${deviceId}\n主題: ${topic}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`MQTT 主題訂閱失敗: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('API Bridge MCP Server 已啟動');
  }
}

// 導出類以供測試使用
export { ApiMcpServer };

// 只有當直接執行此文件時才啟動服務器
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ApiMcpServer();
  server.run().catch(console.error);
}