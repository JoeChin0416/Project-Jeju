# Firebase 專案切換說明

目前 Web App 已切換至 Firebase 專案：

```text
jeju-travel-f136b
```

## Firebase Console 設定

前往 [Firebase Console](https://console.firebase.google.com/) 並開啟 `jeju-travel-f136b`。

### 1. Authentication

在 `Authentication -> Sign-in method` 啟用：

- Email/Password
- Google

在 `Authentication -> Settings -> Authorized domains` 確認包含：

- `localhost`
- 部署 GitHub Pages 後的 `<github-username>.github.io`

App 使用 Firebase 的 `GoogleAuthProvider + signInWithPopup`，不需要另外在程式碼中設定 Google OAuth Client ID。

### 2. Firestore Database

建立 Firestore Database。資料庫位置選擇靠近主要使用者的區域，建立後部署專案內的 `firestore.rules`。

### 3. Storage

建立 Firebase Storage bucket，建立後部署專案內的 `storage.rules`。

### 4. 部署安全規則

```powershell
npx firebase login
npx firebase use jeju-travel-f136b
npx firebase deploy --only firestore:rules,storage
```

可在本機先執行規則測試：

```powershell
npm run test:rules
```

## 首次登入順序

1. 在新 Firebase 專案的 Authentication 建立一個 Email/Password 使用者。
2. 使用該 Email/Password 帳號登入 App。
3. App 會初始化 Google 登入白名單設定與共同行程資料。
4. 再測試 Google 登入，並於設定頁管理 Google Email 白名單。

Email/Password 帳號不受 Google Email 白名單限制。
Google 白名單為空時，所有 Google 帳號都會被拒絕，以避免公開網站遭未授權存取。

公開網站前，請在 Google Cloud Identity Platform 設定頁停用終端使用者建立與刪除帳號。否則即使 App 沒有註冊按鈕，外部使用者仍可能透過 Firebase 公開 API 建立 Password 帳號。

## 舊資料注意事項

更換 Firebase 專案不會自動搬移舊專案的資料：

- Authentication 使用者需在新專案重新建立。
- Firestore 行程、記帳與旅記資料需另行搬移。
- Storage 圖片需另行搬移。

正式搬移前，建議保留舊專案，確認新專案登入、同步與圖片上傳均正常後再決定是否停用。
