# Project Jeju Technical Design

## Architecture

Project Jeju is a static mobile-first SPA using HTML, CSS, and Vanilla JavaScript ES Modules.

The app has one HTML entry point and multiple source modules. It does not use a framework, bundler, npm build step, or custom backend server.

## File Structure

```text
/
  index.html
  styles/
    base.css
    layout.css
    components.css
    views.css
  src/
    app.js
    config/
      firebase-config.js
    services/
      firebase.js
      auth.js
      db.js
      ai.js
    state/
      app-state.js
      trip-store.js
    views/
      itinerary-view.js
      packing-view.js
      camera-view.js
      expenses-view.js
      settings-view.js
    features/
      itinerary.js
      distance.js
      packing.js
      ocr-receipt.js
      translation.js
      expenses.js
      settlement.js
    utils/
      currency.js
      dates.js
      dom.js
      validators.js
```

## Module Responsibilities

### `index.html`

- Defines the app shell.
- Loads CSS files.
- Provides root elements for:
  - Auth screen
  - Main app container
  - View outlet
  - Bottom navigation
  - Modal/dialog root
  - Hidden file input for image upload
- Loads `src/app.js` with `<script type="module">`.

### `src/app.js`

- Initializes Firebase.
- Subscribes to auth state changes.
- Initializes app state.
- Handles simple hash routing.
- Renders the active view.
- Coordinates current user and current trip loading.

### `services/`

- `firebase.js`: Initializes Firebase app, Auth, and Firestore.
- `auth.js`: Email/password and Google sign-in/sign-out helpers.
- `db.js`: Firestore CRUD helpers and path builders.
- `ai.js`: AI API request wrapper using the API key from localStorage.

### `state/`

- `app-state.js`: In-memory UI state such as active tab, auth user, selected trip, loading status, and transient OCR data.
- `trip-store.js`: Trip-level load/save helpers and current trip selection.

### `views/`

Views own DOM rendering and event binding. They call services, state modules, and feature logic, but do not contain complex business algorithms.

### `features/`

Feature modules contain testable business logic:

- `distance.js`: Haversine distance and travel-time estimate.
- `ocr-receipt.js`: AI OCR response normalization and validation.
- `translation.js`: AI translation response normalization.
- `expenses.js`: Expense item calculations and validation.
- `settlement.js`: Net balance and transfer optimization.

### `utils/`

Small reusable helpers for formatting, validation, DOM creation, dates, and currency.

## Routing

Use simple hash routing:

- `#/itinerary`
- `#/packing`
- `#/camera`
- `#/expenses`
- `#/settings`

No nested router is required for MVP. The app may remember the last active trip and tab in localStorage.

## Firebase

### Authentication

Use Firebase Authentication with:

- Email/password provider.
- Google provider.

### Firestore

Do not enable Firestore offline persistence. The app requires network access.

Recommended path shape:

```text
users/{uid}
users/{uid}/trips/{tripId}
users/{uid}/trips/{tripId}/members/{memberId}
users/{uid}/trips/{tripId}/itineraryDays/{dayId}
users/{uid}/trips/{tripId}/places/{placeId}
users/{uid}/trips/{tripId}/lodgings/{lodgingId}
users/{uid}/trips/{tripId}/transportItems/{transportId}
users/{uid}/trips/{tripId}/packingItems/{packingItemId}
users/{uid}/trips/{tripId}/receiptBatches/{receiptBatchId}
users/{uid}/trips/{tripId}/expenseItems/{expenseItemId}
```

### Security Rules Direction

MVP rules should restrict every user-scoped document to the authenticated owner:

```text
users/{uid}/... allowed only when request.auth.uid == uid
```

No cross-user trip sharing is supported in MVP.

## Data Model

### User Document

```js
{
  displayName: string,
  email: string,
  lastTripId: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Trip

```js
{
  name: string,
  destination: string,
  startDate: string,
  endDate: string,
  baseCurrency: string,
  tripCurrency: string,
  exchangeRate: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Member

```js
{
  name: string,
  color: string,
  sortOrder: number,
  active: boolean
}
```

### Itinerary Day

```js
{
  date: string,
  title: string,
  sortOrder: number
}
```

### Place

```js
{
  dayId: string,
  name: string,
  address: string,
  lat: number | null,
  lng: number | null,
  travelModeToNext: "walking" | "driving" | "transit",
  sortOrder: number,
  notes: string
}
```

### Lodging

```js
{
  name: string,
  address: string,
  checkInAt: string,
  checkOutAt: string,
  confirmationCode: string,
  notes: string
}
```

### Transport Item

```js
{
  type: "flight" | "train" | "bus" | "car" | "other",
  provider: string,
  code: string,
  departAt: string,
  arriveAt: string,
  origin: string,
  destination: string,
  notes: string
}
```

### Packing Item

```js
{
  name: string,
  category: string,
  checked: boolean,
  sortOrder: number
}
```

### Receipt Batch

```js
{
  merchantName: string,
  receiptDate: string,
  currency: string,
  totalOriginal: number,
  exchangeRate: number,
  imageStorageMode: "none" | "local-preview-only",
  aiProvider: "gemini" | "openai",
  rawAiResult: object,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

MVP should avoid storing receipt images in Firestore. Image preview can be transient during confirmation.

### Expense Item

```js
{
  receiptBatchId: string | null,
  source: "manual" | "ocr",
  originalName: string,
  translatedName: string,
  category: string,
  quantity: number,
  unitPriceOriginal: number,
  totalOriginal: number,
  currency: string,
  exchangeRate: number,
  totalBase: number,
  payerId: string,
  participantIds: string[],
  splitMode: "equal" | "ratio" | "fixed",
  splitValues: Record<string, number>,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

For `equal`, `splitValues` can be empty.

For `ratio`, `splitValues[memberId]` is the member's weight.

For `fixed`, `splitValues[memberId]` is that member's base-currency owed amount.

## AI API Key Handling

- AI API key is entered in Settings.
- Store the key only in localStorage.
- Do not write AI API key to Firestore.
- Provide show/hide, test connection, and clear actions.
- Display warning copy that the key is stored locally in the browser.

## AI OCR Contract

The OCR prompt should request strict JSON output:

```js
{
  merchantName: string,
  receiptDate: string | null,
  currency: string | null,
  total: number | null,
  items: [
    {
      originalName: string,
      translatedNameZhTw: string,
      unitPrice: number | null,
      quantity: number | null,
      subtotal: number | null
    }
  ]
}
```

The app must validate and normalize this response before rendering the confirmation screen.

## OCR Confirmation Flow

1. User captures or uploads an image.
2. App sends image to AI API.
3. App parses and validates JSON.
4. App renders editable confirmation UI.
5. User can add, edit, or delete items.
6. User assigns default payer and split participants.
7. User can override item-level category, payer, and split mode.
8. User confirms import.
9. App writes one receipt batch and one expense item per confirmed item.

If AI fails, show the failure state and offer manual entry.

## Distance Calculation

Use Haversine distance:

```js
distanceKm = haversine(placeA.lat, placeA.lng, placeB.lat, placeB.lng)
```

Estimated minutes:

```js
minutes = distanceKm / speedKmPerHour * 60
```

Speeds:

```js
{
  walking: 5,
  driving: 35,
  transit: 25
}
```

## Settlement Algorithm

For each expense:

1. Add `totalBase` to `paid[payerId]`.
2. Calculate member owed shares from split mode.
3. Add each share to `owed[memberId]`.
4. Calculate `net[memberId] = paid[memberId] - owed[memberId]`.

Interpretation:

- Positive net means the member should receive money.
- Negative net means the member should pay money.

Transfer optimization:

1. Create creditors from positive net balances.
2. Create debtors from negative net balances.
3. Sort or heap both sides by absolute amount.
4. Match the largest debtor with the largest creditor.
5. Emit transfer with `amount = min(debt, credit)`.
6. Reduce both sides and repeat until all balances are zero within rounding tolerance.

This produces a minimal or near-minimal set of transfers for normal trip-settlement cases.

## Rounding

- Store currency amounts as integer minor units where practical.
- For MVP display, round base-currency settlement to the currency's normal precision.
- Fixed split validation must ensure participant shares equal the item total after rounding.

## Error Handling

Show explicit user-facing states for:

- No network.
- Firebase initialization failure.
- Auth failure.
- Firestore read/write failure.
- Missing AI API key.
- AI API request failure.
- Invalid AI JSON response.
- OCR total mismatch.

## Deployment

- Deploy static files to GitHub Pages.
- No build command is required.
- Firebase config is included in frontend source.
- Firebase project must configure authorized domains for GitHub Pages and local development.

## Implementation Order

1. Create app shell and CSS foundation.
2. Add hash routing and bottom navigation.
3. Add Firebase initialization and Auth.
4. Add trip creation and current-trip loading.
5. Add members and settings.
6. Add itinerary, lodging, transport, and distance estimation.
7. Add packing list.
8. Add manual expenses and settlement algorithm.
9. Add AI key settings.
10. Add receipt OCR confirmation flow.
11. Add translation mode.
12. Polish mobile UX and error states.

## Verification Plan

- Smoke test static app loading from a local static server.
- Verify mobile viewport layout.
- Verify hash navigation.
- Verify Firebase login with Email/password and Google.
- Verify Firestore security rules manually in Firebase emulator or Firebase console rule tests.
- Unit-test pure feature modules where possible:
  - Distance calculation.
  - Currency conversion.
  - Expense split calculation.
  - Settlement transfer optimization.
  - OCR response normalization.
- Manually test OCR confirmation with at least:
  - Japanese receipt.
  - Korean receipt.
  - English receipt.
  - OCR failure or malformed AI response.
