# Firebase 專案切換筆記

目前前端 Firebase Web App 設定指向：

```text
jeju-travel-f136b
```

## 1. Authentication

在 Firebase Console 的 `Authentication -> Sign-in method` 啟用：

- Email/Password
- Google

在 `Authentication -> Settings -> Authorized domains` 加入：

- `localhost`
- GitHub Pages 網域，例如 `<github-username>.github.io`

注意：不要在 Google Cloud Identity Platform 停用「終端使用者建立帳號」。Google OAuth 第一次登入會建立 Firebase Auth 使用者，如果停用會出現：

```text
Firebase: Error (auth/admin-restricted-operation)
```

本專案不靠關閉 Auth 註冊來保護資料，而是靠：

- App 內 Google 白名單。
- App 內旅伴角色清單。
- `firestore.rules` 與 `storage.rules` 的 `adminEmails`、`memberEmails`、`googleWhitelist`。

Password 帳號即使能透過 Firebase Auth 建立，只要不在 `adminEmails` 或 `memberEmails`，仍不能讀寫共用旅行資料。

## 2. Firestore Database

建立 Firestore Database，模式可選正式模式，然後部署本 repo 的 `firestore.rules`。

共用資料路徑：

```text
sharedTrips/jeju-2026-girls/stores/default
sharedTrips/jeju-2026-girls/access/default
```

個人行李資料路徑：

```text
users/{uid}/personalPacking/jeju-2026-girls
```

## 3. Storage

建立 Firebase Storage bucket，部署本 repo 的 `storage.rules`。

主要上傳資料包含：

- OCR 收據照片。
- 旅記照片。
- 停車位置照片。

## 4. 部署規則

```powershell
npx firebase login
npx firebase use jeju-travel-f136b
npx firebase deploy --only firestore:rules,storage
```

本機規則測試需要 Java：

```powershell
npm run test:rules
```

如果出現 `Could not spawn java -version`，請先安裝 Java 21 或在 CI 裡跑規則測試。

## 5. 建議初始化流程

1. 主要管理者 `dpluschin0416@gmail.com` 先登入。
2. 到設定頁建立自己的旅伴角色。
3. 在設定頁新增其他人的 Google 白名單 Email，或手動建立旅伴角色。
4. 其他人第一次登入後，到設定頁建立/確認自己的角色名稱。
5. 記帳頁的付款人與分帳對象會自動使用旅伴角色清單。
