## 試算表 API 清單與使用說明
## API 網址: https://hshgpt.webduino.tw/

1. **新增一列資料**
   - 路由：`POST /api/sheets/append`
   - Body（JSON）：
     ```json
     {
       "url": string,      // 試算表完整 URL
       "values": Array<any> // 欄位值陣列，如 ["aaa","bbb","ccc"]
     }
     ```
   - 回傳：
     ```json
     { "success": boolean, "data": any }
     ```

2. **讀取所有資料**
   - 路由：`GET /api/sheets/get?url=<試算表URL>`
   - 回傳：
     ```json
     { "success": boolean, "rows": Array<Array<any>> }
     ```

3. **更新指定列資料**
   - 路由：`POST /api/sheets/update`
   - Body（JSON）：
     ```json
     {
       "url": string,       // 試算表 URL
       "rowIdx": number,    // 1-based 列號
       "cols": Array<any>    // 欄位值陣列
     }
     ```
   - 回傳：
     ```json
     { "success": boolean, "result": any }
     ```

4. **刪除指定列資料**
   - 路由：`POST /api/sheets/del`
   - Body（JSON）：
     ```json
     {
       "url": string,    // 試算表 URL
       "rowIdx": number  // 1-based 列號
     }
     ```
   - 回傳：
     ```json
     { "success": boolean, "result": any }
     ```

5. **覆蓋整張試算表**
   - 路由：`POST /api/sheets/save`
   - Body（JSON）：
     ```json
     {
       "url": string,              // 試算表 URL
       "rows": Array<Array<any>>    // 二維陣列格式的新資料
     }
     ```
   - 回傳：
     ```json
     { "success": boolean, "result": any }
     ```

---

