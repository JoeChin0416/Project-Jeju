# GitHub Pages 部署說明

專案使用 Vite 建置，`vite.config.js` 已支援部署到 GitHub Pages 子路徑。

## 1. 先完成 Firebase 設定

依照 [Firebase 專案切換說明](./FIREBASE_PROJECT_SWITCH.md)：

1. 啟用 Email/Password 與 Google 登入。
2. 建立 Firestore Database 與 Storage。
3. 部署 Firestore 與 Storage 安全規則。
4. 使用 Email/Password 帳號完成首次登入。
5. 在 Google Cloud Identity Platform 設定中停用終端使用者建立與刪除帳號，只允許管理者建立 Email/Password 帳號。

公開網站一定要完成第 5 步。Firebase Email/Password 預設允許終端使用者自行註冊，即使 App 沒有顯示註冊按鈕，仍可能透過公開 API 建立帳號。

## 2. 公開 Repository 前清理

不應提交或公開：

- `.omx/` 執行紀錄與本機狀態
- `.env`、`.env.local` 與任何 AI API Key
- `guam-trip/` 設計參考專案與其 Firebase 設定
- 本機測試截圖、分析 HTML 與建置產物

如果這些檔案曾存在於 Git 歷史中，只新增刪除 commit 不足以移除歷史內容。公開前應重寫尚未公開的歷史，或建立新的乾淨 Repository。

## 3. 建立 GitHub Repository

目前工作目錄尚未包含 Git metadata 時，可執行：

```powershell
git init
git add .
git commit -m "Prepare the travel app for verified static deployment"
git branch -M main
git remote add origin https://github.com/<github-username>/Project-Jeju.git
git push -u origin main
```

專案內的 `.github/workflows/deploy-pages.yml` 會在推送到 `main` 後：

1. 執行測試。
2. 執行 Firebase 規則測試。
3. 建立 production build。
4. 將 `dist` 部署至 GitHub Pages。

## 4. 啟用 GitHub Pages

在 GitHub Repository：

1. 開啟 `Settings`。
2. 選擇 `Pages`。
3. 在 `Build and deployment` 將 `Source` 設為 `GitHub Actions`。

部署網址通常為：

```text
https://<github-username>.github.io/Project-Jeju/
```

## 5. 授權 GitHub Pages 網域

在 Firebase Console：

1. 開啟 `Authentication`。
2. 開啟 `Settings`。
3. 找到 `Authorized domains`。
4. 新增 `<github-username>.github.io`。

Google 登入使用 Firebase Google Provider，不需要另外將 OAuth Client ID 寫入程式碼。

## 6. 部署後檢查

- Email/Password 登入可正常使用。
- Google 登入可正常跳出帳號選擇並完成登入。
- 行程、記帳與旅記可由不同成員即時同步。
- 個人行李只顯示目前登入者的資料。
- 旅記與停車照片可上傳及預覽。
- 天氣資訊可正常取得。
- 手機相機功能在 HTTPS 網址可正常啟動。

## 安全提醒

- Firebase Web API Key 可以出現在前端，真正的資料權限由 Firestore 與 Storage Rules 保護。
- Gemini 或其他 AI API Key 不應提交到 GitHub。
- 不要將 Firebase Admin SDK 私鑰或服務帳戶 JSON 放入 Repository。
