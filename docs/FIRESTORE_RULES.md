# Firebase 安全規則

本專案使用下列 Firebase 設定檔：

- `firestore.rules`
- `storage.rules`
- `firebase.json`
- `.firebaserc`

## 資料邊界

### 共用旅行資料

```text
sharedTrips/jeju-2026-girls/stores/default
```

行程、住宿、交通、記帳、分帳、旅記等共用資料都在這裡。可讀寫者必須符合下列其中之一：

- 主要管理者：`dpluschin0416@gmail.com`
- `adminEmails` 內的帳號
- `memberEmails` 內的旅伴帳號
- 使用 Google 登入且 Email 在 `googleWhitelist`

未登入、未列入名單的 Google 帳號、未列入 `memberEmails` 的 Password 帳號都不能讀寫。

### 權限設定

```text
sharedTrips/jeju-2026-girls/access/default
```

儲存：

- `googleWhitelist`
- `memberEmails`
- `adminEmails`

主要管理者可建立權限文件；已允許的旅行使用者可更新權限設定，讓 App 能共同管理旅伴角色與白名單。

### 個人行李

```text
users/{uid}/personalPacking/jeju-2026-girls
```

個人行李只允許該 Firebase Auth UID 本人讀寫。

### Storage 圖片

```text
trips/{tripId}/...
```

旅記照片、收據照片、停車照片只允許已授權的旅行使用者讀寫。上傳限制：

- 必須是圖片 content type。
- 檔案小於 10 MB。

## 規則測試

Firestore/Storage Emulator 需要 Java。

```powershell
npm run test:rules
```

測試重點：

- 未登入者與未列入名單者無法讀取共用旅行。
- 白名單 Google 使用者可在建立旅伴角色前登入並讀寫。
- Password 使用者必須是 owner/admin/member 才能讀寫共用旅行。
- 個人行李只能本人讀寫。
- Storage 只接受授權使用者上傳圖片。

## 部署規則

```powershell
npx firebase login
npx firebase use jeju-travel-f136b
npx firebase deploy --only firestore:rules,storage
```

Google 登入第一次會建立 Firebase Auth 使用者，所以不要停用 Identity Platform 的終端使用者建立帳號。資料安全由這些 Firestore/Storage Rules 負責。
