#!/usr/bin/env node

/**
 * API Bridge MCP Server 使用範例
 * 
 * 這個檔案展示如何在實際應用中使用各種 API 功能：
 * 1. Google Sheets API 操作
 * 2. Azure AI 對話
 * 3. MQTT 訊息傳遞
 */

// 注意：這些是使用範例，實際使用時需要通過 MCP 客戶端調用

const examples = {
  // === Google Sheets API 範例 ===
  googleSheets: {
    // 1. 新增資料到試算表
    append: {
      tool: 'google_sheet_append',
      args: {
        url: 'https://docs.google.com/spreadsheets/d/your-sheet-id/edit',
        values: ['張三', '25', '工程師', '2024-01-15']
      },
      description: '將一筆新記錄新增到試算表末尾'
    },

    // 2. 讀取試算表所有資料
    get: {
      tool: 'google_sheet_get',
      args: {
        url: 'https://docs.google.com/spreadsheets/d/your-sheet-id/edit'
      },
      description: '讀取試算表中的所有資料'
    },

    // 3. 更新指定列資料
    update: {
      tool: 'google_sheet_update',
      args: {
        url: 'https://docs.google.com/spreadsheets/d/your-sheet-id/edit',
        rowIdx: 2,  // 更新第2列
        cols: ['李四', '30', '設計師', '2024-01-16']
      },
      description: '更新試算表中第2列的資料'
    },

    // 4. 刪除指定列
    delete: {
      tool: 'google_sheet_delete',
      args: {
        url: 'https://docs.google.com/spreadsheets/d/your-sheet-id/edit',
        rowIdx: 3   // 刪除第3列
      },
      description: '刪除試算表中的第3列'
    },

    // 5. 覆蓋整張試算表
    save: {
      tool: 'google_sheet_save',
      args: {
        url: 'https://docs.google.com/spreadsheets/d/your-sheet-id/edit',
        rows: [
          ['姓名', '年齡', '職業', '日期'],
          ['王五', '28', '產品經理', '2024-01-17'],
          ['趙六', '35', '技術主管', '2024-01-18']
        ]
      },
      description: '用新資料完全覆蓋試算表內容'
    }
  },

  // === Azure AI API 範例 ===
  azureAI: {
    // 1. 同步程式碼範例
    codeSync: {
      tool: 'azure_ai_chat',
      args: {
        prompt: '我需要一個客服聊天機器人的程式碼範例，要能處理常見問題',
        streaming: false
      },
      description: '產生 Azure AI 同步調用的程式碼範例'
    },

    // 2. 串流程式碼範例
    codeStreaming: {
      tool: 'azure_ai_chat',
      args: {
        prompt: '我需要一個即時對話的網頁應用程式範例',
        streaming: true
      },
      description: '產生 Azure AI 串流調用的程式碼範例'
    }
  },

  // === MQTT API 範例 ===
  mqtt: {
    // 1. 建立 MQTT 裝置
    createDevice: {
      tool: 'mqtt_device_create',
      args: {
        deviceId: 'sensor001'
      },
      description: '建立一個名為 sensor001 的 MQTT 裝置'
    },

    // 2. 發布訊息（非同步）
    publish: {
      tool: 'mqtt_publish',
      args: {
        deviceId: 'sensor001',
        topic: 'server001.data',
        payload: {
          temperature: 25.5,
          humidity: 60.2,
          timestamp: new Date().toISOString()
        },
        qos: 0
      },
      description: '從 sensor001 發送感測器資料到 server001'
    },

    // 3. 同步發布訊息並等待回應
    publishSync: {
      tool: 'mqtt_publish_sync',
      args: {
        deviceId: 'client001',
        topic: 'server001.getConfig',
        payload: {
          configType: 'network'
        },
        timeout: 10000,
        qos: 1
      },
      description: '向 server001 請求網路設定，並等待回應'
    },

    // 4. 註冊訊息處理器
    registerHandler: {
      tool: 'mqtt_register_handler',
      args: {
        deviceId: 'server001',
        action: 'data',
        handlerCode: `
          // 處理感測器資料
          const { payload } = message;
          console.log('收到感測器資料:', payload);
          
          // 處理溫度警報
          if (payload.temperature > 30) {
            console.log('溫度過高警報！');
            return { 
              status: 'warning', 
              message: '溫度超過閾值',
              recommendAction: 'check_cooling_system'
            };
          }
          
          return { 
            status: 'ok',
            processed: true,
            timestamp: new Date().toISOString()
          };
        `
      },
      description: '為 server001 註冊處理 data 動作的處理器'
    },

    // 5. 訂閱額外主題
    subscribe: {
      tool: 'mqtt_subscribe',
      args: {
        deviceId: 'monitor001',
        topic: 'alerts/+',  // 訂閱所有警報訊息
        qos: 1
      },
      description: '讓 monitor001 訂閱所有警報訊息'
    }
  },

  // === 綜合應用範例 ===
  compositeExamples: {
    // IoT 資料收集與記錄系統
    iotDataLogger: [
      {
        step: 1,
        description: '建立感測器裝置',
        tool: 'mqtt_device_create',
        args: { deviceId: 'temperature_sensor' }
      },
      {
        step: 2,
        description: '建立資料處理伺服器',
        tool: 'mqtt_device_create',
        args: { deviceId: 'data_server' }
      },
      {
        step: 3,
        description: '註冊資料處理器，將資料記錄到 Google Sheets',
        tool: 'mqtt_register_handler',
        args: {
          deviceId: 'data_server',
          action: 'logData',
          handlerCode: `
            // 使用 MCP 調用 Google Sheets API
            const { payload } = message;
            
            // 這裡需要實際的 MCP 客戶端來調用 google_sheet_append
            console.log('記錄資料到 Google Sheets:', payload);
            
            return { 
              status: 'logged',
              timestamp: new Date().toISOString()
            };
          `
        }
      },
      {
        step: 4,
        description: '感測器發送資料',
        tool: 'mqtt_publish',
        args: {
          deviceId: 'temperature_sensor',
          topic: 'data_server.logData',
          payload: {
            sensorId: 'temp001',
            temperature: 23.5,
            location: '會議室A',
            timestamp: new Date().toISOString()
          }
        }
      }
    ],

    // AI 助手與試算表整合
    aiSpreadsheetAssistant: [
      {
        step: 1,
        description: '讀取試算表資料',
        tool: 'google_sheet_get',
        args: {
          url: 'https://docs.google.com/spreadsheets/d/sales-data/edit'
        }
      },
             {
         step: 2,
         description: '產生 AI 分析程式碼範例',
         tool: 'azure_ai_chat',
         args: {
           prompt: '我需要一個使用 Azure AI 分析銷售資料並產生報告的程式碼範例',
           streaming: false
         }
       },
      {
        step: 3,
        description: '將 AI 分析結果寫入新的試算表',
        tool: 'google_sheet_append',
        args: {
          url: 'https://docs.google.com/spreadsheets/d/analysis-results/edit',
          values: ['分析日期', 'AI建議', '趨勢', '行動項目']
        }
      }
    ]
  }
};

// 輸出範例資料，供參考使用
console.log('=== API Bridge MCP Server 使用範例 ===\n');
console.log(JSON.stringify(examples, null, 2));

export { examples }; 