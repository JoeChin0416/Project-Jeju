# Firebase 權限與同步

專案根目錄已提供可部署的規則：

- `firestore.rules`
- `storage.rules`
- `firebase.json`
- `.firebaserc`

## 資料邊界

- `sharedTrips/jeju-2026-girls/stores/default`
  - 共用行程、住宿交通、成員、記帳、旅記與租車檢查清單。
  - Email/密碼登入者可以讀寫。
  - Google 登入者必須在白名單內；白名單存在但為空陣列時，開放所有 Google 登入者。
- `sharedTrips/jeju-2026-girls/access/default`
  - Google 登入白名單。
  - 所有登入者可讀，只有 Email/密碼登入者可修改。
- `users/{uid}/personalPacking/jeju-2026-girls`
  - 個人行李清單。
  - 只有該 `uid` 本人可讀寫。
- `trips/{tripId}/...`
  - 旅記、收據與停車照片。
  - 使用與共用旅行資料相同的登入權限，只接受小於 10 MB 的圖片。

## 本機驗證

Firestore Emulator 需要 Java 21。

```powershell
npm run test:rules
```

測試會驗證：

- 未登入者與未列入白名單的 Google 帳號無法讀取共用旅行。
- Email/密碼登入者與白名單 Google 帳號可即時同步共用資料。
- 個人行李只能由本人讀寫。
- Google 白名單只能由 Email/密碼登入者管理。
- Storage 只接受授權使用者上傳的圖片。

## 部署規則

```powershell
npx firebase login
npx firebase deploy --only firestore:rules,storage
```

首次部署使用 Firestore 文件判斷 Storage 權限時，Firebase 可能要求啟用 Storage Rules 存取 Firestore 的權限，依 CLI 或 Console 提示啟用即可。
