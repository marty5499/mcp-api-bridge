#!/usr/bin/env node

/**
 * Azure AI Chat 工具測試腳本
 * 用於測試不同的使用案例和驗證程式碼範例輸出
 */

import { spawn } from 'child_process';

const testCases = [
  {
    name: '客服聊天機器人 (同步)',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'azure_ai_chat',
        arguments: {
          prompt: '我需要一個智能客服聊天機器人，能自動回覆常見問題和轉人工服務',
          streaming: false
        }
      }
    }
  },
  {
    name: '即時對話網頁 (串流)',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'azure_ai_chat',
        arguments: {
          prompt: '我需要一個網頁版即時對話應用，要有美觀的 UI 和串流回應',
          streaming: true
        }
      }
    }
  },
  {
    name: '文件分析助手 (同步)',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'azure_ai_chat',
        arguments: {
          prompt: '我需要一個文件分析助手，能讀取 PDF 並提供摘要和問答功能',
          streaming: false
        }
      }
    }
  },
  {
    name: '語音助手集成 (串流)',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'azure_ai_chat',
        arguments: {
          prompt: '我需要整合語音識別和 Azure AI 的語音助手程式碼',
          streaming: true
        }
      }
    }
  }
];

async function runTest(testCase) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 測試案例: ${testCase.name}`);
    console.log('─'.repeat(50));
    
    const child = spawn('node', ['mcp-api-bridge.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // 解析 JSON 回應
          const lines = output.split('\n');
          const jsonLine = lines.find(line => line.startsWith('{"result"'));
          
          if (jsonLine) {
            const response = JSON.parse(jsonLine);
            console.log('✅ 測試成功');
            console.log('📝 回應內容:');
            
            // 提取並格式化程式碼範例
            const content = response.result.content[0].text;
            const codeMatch = content.match(/```[\s\S]*?```/);
            
            if (codeMatch) {
              console.log('📋 程式碼範例已產生');
              console.log('🔍 程式碼長度:', codeMatch[0].length, '字元');
              
              // 檢查關鍵內容
              const hasWebSocket = content.includes('WebSocket');
              const hasErrorHandling = content.includes('error');
              const hasPrompt = content.includes('prompt');
              
              console.log('✓ 包含 WebSocket 連線:', hasWebSocket ? '是' : '否');
              console.log('✓ 包含錯誤處理:', hasErrorHandling ? '是' : '否');
              console.log('✓ 包含 prompt 處理:', hasPrompt ? '是' : '否');
              
              resolve({
                success: true,
                hasCode: true,
                hasWebSocket,
                hasErrorHandling,
                hasPrompt,
                codeLength: codeMatch[0].length
              });
            } else {
              console.log('❌ 未找到程式碼範例');
              resolve({
                success: true,
                hasCode: false
              });
            }
          } else {
            console.log('❌ 無效的回應格式');
            resolve({ success: false, error: 'Invalid response format' });
          }
        } catch (error) {
          console.log('❌ JSON 解析錯誤:', error.message);
          resolve({ success: false, error: error.message });
        }
      } else {
        console.log('❌ 程序執行錯誤');
        resolve({ success: false, error: errorOutput });
      }
    });

    // 發送測試請求
    child.stdin.write(JSON.stringify(testCase.request) + '\n');
    child.stdin.end();

    // 逾時處理
    setTimeout(() => {
      child.kill();
      reject(new Error('測試逾時'));
    }, 10000);
  });
}

async function runAllTests() {
  console.log('🚀 開始 Azure AI Chat 工具測試');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await runTest(testCase);
      results.push({ name: testCase.name, ...result });
    } catch (error) {
      console.log(`❌ 測試失敗: ${error.message}`);
      results.push({ name: testCase.name, success: false, error: error.message });
    }
  }
  
  // 測試結果總結
  console.log('\n📊 測試結果總結');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.success);
  const withCode = results.filter(r => r.hasCode);
  
  console.log(`✅ 成功測試: ${successful.length}/${results.length}`);
  console.log(`📋 產生程式碼: ${withCode.length}/${results.length}`);
  
  if (withCode.length > 0) {
    const avgCodeLength = Math.round(
      withCode.reduce((sum, r) => sum + (r.codeLength || 0), 0) / withCode.length
    );
    console.log(`📏 平均程式碼長度: ${avgCodeLength} 字元`);
  }
  
  console.log('\n📝 詳細結果:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const code = result.hasCode ? '📋' : '📄';
    console.log(`${status} ${code} ${result.name}`);
    
    if (result.success && result.hasCode) {
      console.log(`   - WebSocket: ${result.hasWebSocket ? '✓' : '✗'}`);
      console.log(`   - 錯誤處理: ${result.hasErrorHandling ? '✓' : '✗'}`);
      console.log(`   - Prompt 處理: ${result.hasPrompt ? '✓' : '✗'}`);
    }
    
    if (!result.success && result.error) {
      console.log(`   錯誤: ${result.error}`);
    }
  });
  
  console.log('\n🎉 測試完成！');
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testCases }; 