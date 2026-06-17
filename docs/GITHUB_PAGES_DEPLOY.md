# GitHub Pages 部署筆記

本專案是 Vite 靜態 SPA，可部署到 GitHub Pages。`vite.config.js` 已設定 GitHub Pages 專案路徑。

## 1. Firebase 上線前檢查

先完成 [Firebase 專案切換筆記](./FIREBASE_PROJECT_SWITCH.md)：

1. 啟用 Authentication 的 Email/Password 與 Google 登入。
2. 建立 Firestore Database 與 Firebase Storage。
3. 部署 `firestore.rules` 與 `storage.rules`。
4. 在 App 設定頁建立旅伴角色、Google 白名單與每日預算。
5. 不要停用 Firebase Auth 的終端使用者建立帳號；Google 第一次登入需要建立 Auth 使用者，實際資料權限由 Firestore/Storage Rules 控管。

公開網站後，即使有人透過公開 API 建立 Password 帳號，只要該 Email 不在 `adminEmails` 或 `memberEmails`，就不能讀寫共用旅行資料。

## 2. Repository 安全檢查

不要提交下列內容：

- `.env`、`.env.local` 或任何 Gemini/OpenAI API Key。
- Firebase Admin SDK service account JSON。
- 個人下載資料、測試截圖或不需要部署的原型資料夾。
- `.omx/`、臨時報告、分析輸出或本機快取。

Firebase Web API Key 可以放在前端；它不是後端密鑰，安全邊界在 Firestore/Storage Rules。

## 3. GitHub Pages 設定

到 GitHub Repository：

1. 進入 `Settings`。
2. 進入 `Pages`。
3. `Build and deployment` 的 `Source` 選 `GitHub Actions`。

推到 `main` 後，`.github/workflows/deploy-pages.yml` 會：

1. 安裝相依套件。
2. 建置 Vite production build。
3. 將 `dist` 發佈到 GitHub Pages。

部署網址格式：

```text
https://<github-username>.github.io/Project-Jeju/
```

## 4. Firebase Authorized Domains

到 Firebase Console：

1. `Authentication`。
2. `Settings`。
3. `Authorized domains`。
4. 新增 `<github-username>.github.io`。

若 Google 登入出現 `origin_mismatch`，也要到 Google Cloud Console 的 OAuth Client 補上 JavaScript 來源：

```text
http://localhost:5174
https://<github-username>.github.io
```

## 5. 上線後驗收

- Email/Password 帳號能登入。
- Google 白名單 Email 能登入，且第一次登入後可建立旅伴角色。
- 未在白名單、管理員或旅伴角色內的帳號不能讀寫共用資料。
- 行程、記帳、旅記為共用同步。
- 行李清單只顯示該登入帳號自己的資料。
- Storage 圖片可上傳、預覽，且無權限帳號不能讀取。
