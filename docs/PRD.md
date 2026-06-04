# Project Jeju PRD

## Product Summary

Project Jeju is a mobile-first travel SPA for planning trips, importing receipt data with AI OCR, managing expenses, and calculating settlement transfers between trip members.

The first version is a static web app deployable to GitHub Pages. It uses Firebase for authentication and online data storage, and requires network access while in use.

## Target Users

- Travelers who want to manage itinerary, packing, expenses, and settlement in one mobile web app.
- Small travel groups where one logged-in user manages the trip data.
- Users who need OCR and Traditional Chinese translation for receipts, especially Japanese, Korean, or English receipts.

## MVP Scope

### Authentication

- Email and password login.
- Google OAuth login.
- Firebase Authentication is the authentication provider.

### Trip Management

- A logged-in user can create and manage multiple trips.
- The app opens the most recently used trip by default.
- Each trip contains itinerary, lodging, transport, packing, expenses, members, and settings.

### Navigation

The app uses a fixed bottom navigation bar with five primary destinations:

- Itinerary
- Packing
- Camera
- Expenses
- Settings

The Camera tab is centered and visually emphasized as a raised circular action.

### Itinerary, Lodging, and Transport

- Itinerary is organized by day.
- Users can add, edit, reorder, and delete places.
- Lodging and transport are contained inside the Itinerary tab through segmented sections.
- A place opens Google Maps in a new tab using the place name, address, or coordinates.
- When adjacent places have coordinates, the app shows straight-line distance and estimated travel time.
- Travel time is a simple estimate, not an external route calculation.

### Distance and Time Estimation

- Use the Haversine formula for straight-line distance.
- Estimate travel time from distance and selected mode:
  - Walking: 5 km/h
  - Driving: 35 km/h
  - Transit: 25 km/h
- If coordinates are missing, do not estimate distance or time.
- Google Directions API is not part of the MVP.

### Camera, OCR, and Translation

- The centered Camera action opens the camera/OCR workflow.
- Camera supports two modes:
  - Receipt mode, default.
  - Translation mode.
- Receipt mode lets users take or upload a receipt image.
- The app sends the image to the user-configured AI provider API.
- OCR extracts:
  - Merchant name
  - Date
  - Currency
  - Original item names
  - Traditional Chinese item translations
  - Unit price
  - Quantity
  - Subtotal
  - Receipt total
- OCR results must always go through a confirmation and edit screen before becoming formal expense records.
- Users can manually correct item names, translations, quantities, prices, totals, categories, payer, and split settings.
- If AI OCR fails, the app keeps the image preview and offers manual expense entry.
- Translation mode extracts visible text and displays Traditional Chinese translation without creating expense records.

### Expenses and Settlement

- Members are names within a trip. They do not need login accounts.
- Use the term "payer" for the person who paid.
- Expenses can be entered manually or imported from confirmed OCR items.
- Receipt imports are stored as a receipt batch plus item-level expense records.
- Each expense item supports:
  - Payer
  - Category
  - Total amount
  - Original currency
  - Base currency converted amount
  - Split participants
  - Split mode
- Split modes:
  - Equal split
  - Ratio split
  - Manual fixed amount split
- Settlement calculates each member's paid amount, owed amount, and net balance.
- Settlement produces optimized transfer suggestions showing who should pay whom and how much.

### Currency and Exchange Rate

- Each trip has:
  - Base currency, such as TWD
  - Trip currency, such as JPY, KRW, or USD
  - Manual exchange rate
- Expenses store original amount, original currency, converted base amount, and the exchange rate used at creation time.
- Settlement uses base currency.
- No live exchange-rate API in MVP.

### Packing

- Users can create, edit, check, uncheck, and delete packing items.
- Packing items belong to a trip.

### Settings

- Firebase config is deployed with the frontend app.
- The AI API key is entered by the user in Settings.
- The AI API key is stored only in localStorage.
- The AI API key is not stored in Firestore.
- Settings include showing, hiding, testing, and clearing the AI API key.
- Settings include trip currency and exchange-rate configuration.

## Non-Goals

- No multi-user collaboration in MVP.
- No trip invitation flow.
- No per-member login accounts.
- No real-time conflict resolution.
- No offline-first behavior.
- No Firestore offline persistence.
- No Google Directions API route calculation.
- No live exchange-rate API.
- No backend proxy for AI API keys in MVP.
- No framework such as React, Vue, or Svelte.
- No bundler or build step.

## User Flows

### First Use

1. User opens the app.
2. User signs in with Email/password or Google.
3. User creates a trip or opens the latest trip.
4. User configures members, currency, exchange rate, and AI API key.

### Add Itinerary Place

1. User opens Itinerary.
2. User selects a day.
3. User adds a place with name, address, and optional coordinates.
4. App shows distance and estimated time between adjacent coordinate-backed places.
5. User taps a place to open Google Maps.

### Import Receipt

1. User taps the centered Camera button.
2. User stays in Receipt mode or selects it.
3. User takes or uploads a receipt photo.
4. App sends the image to the configured AI API.
5. App shows editable OCR results.
6. User corrects any wrong items or amounts.
7. User sets payer and split rules.
8. User confirms import.
9. App creates a receipt batch and item-level expense records.

### Settle Expenses

1. User opens Expenses.
2. User reviews expense items and member balances.
3. App calculates net balances.
4. App generates optimized transfer suggestions.

## Acceptance Criteria

- App can be deployed as static files to GitHub Pages.
- App works on mobile-first viewport widths.
- Firebase Auth supports Email/password and Google login.
- A signed-in user can create multiple trips.
- Bottom navigation has Itinerary, Packing, raised Camera, Expenses, and Settings.
- OCR results are never written to expenses without user confirmation.
- OCR confirmation screen allows manual corrections.
- Expenses support equal, ratio, and fixed split modes.
- Settlement generates transfer suggestions.
- AI API key is stored only in localStorage.
- App shows clear errors when network, Firebase, or AI API calls fail.
