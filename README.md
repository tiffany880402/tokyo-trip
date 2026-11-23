# 2026 年末東京自由行

手機用的東京行程小網站：行程（每天的照片卡片）、記帳（誰付了多少、分帳結算）、資訊、購物清單。

- 用 Google 登入；主揪建立行程後，用邀請連結（`#join-邀請碼`）讓旅伴加入。
- 資料存在 Firebase（和露營日誌同一個專案 `camping-log-7d4a6`），行程存成 `trips/{id}`，沿用同一份 firestore.rules：只有成員能讀寫。
- 推到 `main` 會用 GitHub Actions 自動部署到 GitHub Pages。

```bash
npm install
npm run dev     # 本機預覽
npm run build   # 建置到 dist/
```
