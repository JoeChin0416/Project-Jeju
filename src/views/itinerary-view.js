import { getMood, normalizeMoodId, TRIP_MOODS } from "../features/moods.js";
import { buildGoogleMapsSearchUrl, buildMapProviderUrls, buildNaverMapSearchUrl, buildPlaceSearchQuery, movePlaceWithinDay } from "../features/itinerary.js";
import { getDailyWeather, getDepartureReminder } from "../features/travel-weather.js";
import { normalizeRentalChecklist, toggleRentalChecklistItem } from "../features/rental-checklist.js";
import { fetchTripWeather } from "../services/weather.js";
import { uploadParkingPhoto } from "../services/storage.js?v=20260604-qa-weather-ocr";
import { state } from "../state/app-state.js";
import { updateActiveTrip } from "../state/trip-store.js?v=20260604-qa-weather-ocr";
import { escapeHtml, formToObject } from "../utils/dom.js";
import { fileToCompressedImage } from "../utils/image.js?v=20260604-qa-weather-ocr";

const T = {
  destinationFallback: "目的地",
  tripFallback: "新的旅行",
  member: "位成員",
  days: "天",
  places: "景點",
  lodgingTransport: "住宿交通",
  dailyItinerary: "每日行程",
  lodging: "住宿",
  transport: "交通",
  addPlace: "新增景點",
  editPlace: "編輯景點",
  addLodging: "新增住宿",
  editLodging: "編輯住宿",
  addTransport: "新增交通",
  editTransport: "編輯交通",
  station: "站",
  openMap: "開啟地圖",
  openNaverMap: "用 NAVER Map 開啟",
  mapSearch: "用 Google Maps 搜尋",
  mapSearchInfo: "地圖搜尋設定",
  googleMapQuery: "Google 搜尋字",
  naverMapQuery: "Naver 搜尋字",
  naverMapUrl: "Naver Map 連結",
  mapSearchHint: "Naver 建議填韓文店名或韓文地址；私人住宿或多分店品牌可貼 Naver Map 連結保底。",
  moveUp: "上移",
  moveDown: "下移",
  edit: "編輯",
  delete: "刪除",
  noData: "目前還沒有資料",
  close: "關閉",
  day: "天數",
  placeName: "景點名稱",
  address: "地址 / 地標",
  notes: "備註",
  mood: "心情貼紙",
  noMood: "先不選",
  dailyWeather: "每日天氣",
  weather: "天氣",
  temperature: "溫度",
  rainChance: "降雨機率",
  windSpeed: "最大風速",
  weatherLoading: "正在取得即時天氣...",
  weatherRefresh: "更新天氣",
  weatherSource: "資料來源：Open-Meteo",
  departureReminder: "出發提醒",
  outfitAdvice: "穿搭建議",
  save: "儲存",
  chooseMood: "選擇心情",
  checkIn: "入住時間",
  checkOut: "退房時間",
  confirmation: "確認代碼",
  bookingSource: "訂房來源",
  contact: "聯絡資訊",
  transportType: "交通類型",
  chooseTransport: "選擇交通類型",
  chooseTransportHint: "先選這筆交通的類型，再填寫對應資訊。",
  rentalCar: "租車",
  taxi: "計程車",
  flight: "機票",
  custom: "自訂",
  rentalDesc: "租車公司、取還車、費率、加油與車牌資訊。",
  taxiDesc: "叫車平台、上下車地點、車資、司機與預約資訊。",
  flightDesc: "航空公司、航班、起降時間、航廈、行李與票價。",
  customDesc: "其他交通，例如公車、船票、包車或接駁。",
  viewDetail: "查看交通詳情",
  detailTitle: "交通詳情",
  flightInfo: "航班資訊",
  rentalInfo: "租車資訊",
  taxiInfo: "計程車資訊",
  customInfo: "交通資訊",
  airline: "航空公司",
  flightNo: "航班號碼",
  originCode: "出發代號",
  destinationCode: "抵達代號",
  originCity: "出發城市",
  destinationCity: "抵達城市",
  departAt: "出發時間",
  arriveAt: "抵達時間",
  departureTerminal: "出發航廈",
  arrivalTerminal: "抵達航廈",
  duration: "飛行時間",
  baggage: "行李",
  aircraft: "機型",
  price: "票價",
  purchasedAt: "購買日期",
  bookingCode: "訂位代碼",
  rentalCompany: "租車公司",
  pickupLocation: "取車地點",
  returnLocation: "還車地點",
  pickupAt: "取車時間",
  returnAt: "還車時間",
  pickupAddress: "取車地址",
  rentalRate: "租車費率",
  plateNumber: "車牌",
  fuelInfo: "加油資訊",
  parkingInfo: "停車位置紀錄",
  parkingName: "停車場名稱",
  parkingLocation: "停車地點",
  parkingLevel: "樓層 / 區域",
  parkingPhotoUrl: "停車照片網址",
  parkingPhotoPath: "停車照片路徑",
  parkingPhotoProvider: "停車照片來源",
  captureParkingPhoto: "拍攝停車位置",
  uploadParkingPhoto: "上傳停車照片",
  parkingPhotoUploading: "停車照片上傳中...",
  parkingPhotoFailed: "停車照片上傳失敗，請再試一次。",
  rentalChecklist: "租車檢查清單",
  checklistProgress: "已完成",
  openParkingMap: "開啟停車位置",
  taxiCompany: "叫車平台 / 車行",
  taxiPickupLocation: "上車地點",
  dropoffLocation: "下車地點",
  taxiPickupAt: "上車時間",
  estimatedFare: "預估車資",
  driverContact: "司機 / 聯絡方式",
  customCategoryName: "自訂類別名稱",
  title: "標題",
  dateTime: "日期 / 時間",
  startPoint: "出發 / 起點",
  destination: "目的地",
  amount: "金額",
  date: "日期",
  route: "路線",
  terminal: "航廈",
  provider: "業者",
  editFlight: "編輯航班資訊",
  editRental: "編輯租車資訊",
  editTaxi: "編輯計程車資訊",
  editCustom: "編輯交通資訊",
  noNotes: "目前沒有備註",
};

const TRANSPORT_TYPES = [
  { id: "rental-car", label: T.rentalCar, description: T.rentalDesc, icon: carIcon },
  { id: "taxi", label: T.taxi, description: T.taxiDesc, icon: taxiIcon },
  { id: "flight", label: T.flight, description: T.flightDesc, icon: planeIcon },
  { id: "custom", label: T.custom, description: T.customDesc, icon: ticketIcon },
];

export function itineraryView(trip, render) {
  const days = getSortedDays(trip);
  const activeDay = getActiveDay(trip);
  const currentEntity = sectionToEntity(state.itinerarySection);
  const departureReminder = getDepartureReminder(trip, state.weatherByDate);

  return {
    html: `
      <section class="itinerary-hero span-all">
        <div>
          <span class="brand-mark"><span class="brand-dot"></span>${escapeHtml(trip.destination || T.destinationFallback)}</span>
          <h1>${escapeHtml(trip.name || T.tripFallback)}</h1>
        </div>
        <div class="itinerary-hero-stats">
          <div><strong>${days.length}</strong><span>${T.days}</span></div>
          <div><strong>${trip.places.length}</strong><span>${T.places}</span></div>
          <div><strong>${trip.lodgings.length + trip.transportItems.length}</strong><span>${T.lodgingTransport}</span></div>
        </div>
      </section>
      <section class="panel span-all itinerary-tabs-panel">
        <div class="segmented">
          ${["days", "lodging", "transport"].map((id) => `<button class="segment ${state.itinerarySection === id ? "is-active" : ""}" type="button" data-section="${id}">${label(id)}</button>`).join("")}
        </div>
      </section>
      ${departureReminder.visible ? renderDepartureReminder(departureReminder) : ""}
      ${state.itinerarySection === "days" ? renderDaySelector(trip, days, activeDay) + renderDay(activeDay, trip) : ""}
      ${state.itinerarySection === "lodging" ? renderLodgings(trip) : ""}
      ${state.itinerarySection === "transport" ? renderTransports(trip) : ""}
      <button class="fab" type="button" data-open-itinerary-sheet aria-label="${escapeHtml(addLabel(currentEntity))}">+</button>
      ${renderSheet(trip)}
    `,
    bind(root) {
      root.addEventListener("click", (event) => {
        if (event.target.closest("[data-refresh-weather]")) {
          state.weatherTripKey = "";
          void ensureWeatherLoaded(trip, render);
          return;
        }

        const section = event.target.closest("[data-section]")?.dataset.section;
        if (section) {
          state.itinerarySection = section;
          state.modal = null;
          render();
          return;
        }

        const dayId = event.target.closest("[data-itinerary-day-tab]")?.dataset.itineraryDayTab;
        if (dayId) {
          state.itineraryDayId = dayId;
          render();
          return;
        }

        const moodButton = event.target.closest("[data-place-mood]");
        if (moodButton) {
          const placeId = moodButton.dataset.placeId;
          const moodId = moodButton.dataset.placeMood;
          state.store = updateActiveTrip(state.store, (draft) => {
            const place = draft.places.find((item) => item.id === placeId);
            if (place) place.moodId = place.moodId === moodId ? "" : normalizeMoodId(moodId);
            return draft;
          });
          render();
          return;
        }

        if (event.target.closest("[data-open-itinerary-sheet]")) {
          state.modal = { type: "itinerary", entity: sectionToEntity(state.itinerarySection), mode: "add" };
          render();
          return;
        }

        if (event.target.closest("[data-close-sheet]")) {
          state.modal = null;
          render();
          return;
        }

        const transportType = event.target.closest("[data-transport-type-choice]")?.dataset.transportTypeChoice;
        if (transportType) {
          state.modal = { type: "itinerary", entity: "transport", mode: "add", transportType };
          render();
          return;
        }

        if (event.target.closest("[data-map-search-form]")) {
          openMapSearchFromForm(event.target.closest("form"));
          return;
        }

        const movePlaceButton = event.target.closest("[data-move-place]");
        if (movePlaceButton) {
          state.store = updateActiveTrip(state.store, (draft) => {
            draft.places = movePlaceWithinDay(draft.places, movePlaceButton.dataset.movePlace, movePlaceButton.dataset.moveDirection);
            return draft;
          });
          render();
          return;
        }

        const editPlace = event.target.closest("[data-edit-place]")?.dataset.editPlace;
        const deletePlace = event.target.closest("[data-delete-place]")?.dataset.deletePlace;
        const editLodging = event.target.closest("[data-edit-lodging]")?.dataset.editLodging;
        const deleteLodging = event.target.closest("[data-delete-lodging]")?.dataset.deleteLodging;
        const editTransport = event.target.closest("[data-edit-transport]")?.dataset.editTransport;
        const deleteTransport = event.target.closest("[data-delete-transport]")?.dataset.deleteTransport;
        const viewTransport = event.target.closest("[data-view-transport]")?.dataset.viewTransport;

        if (editPlace) {
          state.modal = { type: "itinerary", entity: "place", mode: "edit", id: editPlace };
          render();
          return;
        }
        if (deletePlace) {
          state.store = updateActiveTrip(state.store, (draft) => {
            draft.places = draft.places.filter((place) => place.id !== deletePlace);
            return draft;
          });
          render();
          return;
        }
        if (editLodging) {
          state.modal = { type: "itinerary", entity: "lodging", mode: "edit", id: editLodging };
          render();
          return;
        }
        if (deleteLodging) {
          state.store = updateActiveTrip(state.store, (draft) => {
            draft.lodgings = draft.lodgings.filter((item) => item.id !== deleteLodging);
            return draft;
          });
          render();
          return;
        }
        if (editTransport) {
          state.modal = { type: "itinerary", entity: "transport", mode: "edit", id: editTransport };
          render();
          return;
        }
        if (deleteTransport) {
          state.store = updateActiveTrip(state.store, (draft) => {
            draft.transportItems = draft.transportItems.filter((item) => item.id !== deleteTransport);
            return draft;
          });
          render();
          return;
        }
        if (viewTransport) {
          state.modal = { type: "itinerary", entity: "transport-detail", id: viewTransport };
          render();
        }
      });

      root.addEventListener("change", (event) => {
        const rentalCheck = event.target.closest("[data-rental-check]");
        if (rentalCheck) {
          const scrollY = window.scrollY;
          const sheetScrollTop = root.querySelector(".bottom-sheet")?.scrollTop ?? 0;
          state.store = updateActiveTrip(state.store, (draft) => {
            const item = draft.transportItems.find((entry) => entry.id === rentalCheck.dataset.transportId);
            if (item) item.rentalChecklist = toggleRentalChecklistItem(item.rentalChecklist, rentalCheck.dataset.rentalCheck);
            return draft;
          });
          render();
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
            const sheet = document.querySelector(".bottom-sheet");
            if (sheet) sheet.scrollTop = sheetScrollTop;
          });
        }
      });

      root.querySelector("[data-place-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formToObject(event.currentTarget);
        state.store = updateActiveTrip(state.store, (draft) => {
          const payload = createPlacePayload(data);
          if (state.modal.mode === "edit") {
            const place = draft.places.find((item) => item.id === state.modal.id);
            if (place) Object.assign(place, payload);
          } else {
            draft.places.push({
              id: crypto.randomUUID(),
              ...payload,
              sortOrder: draft.places.filter((place) => place.dayId === data.dayId).length + 1,
            });
          }
          return draft;
        });
        state.itineraryDayId = data.dayId;
        state.modal = null;
        render();
      });

      root.querySelector("[data-lodging-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formToObject(event.currentTarget);
        state.store = updateActiveTrip(state.store, (draft) => {
          const payload = createLodgingPayload(data);
          if (state.modal.mode === "edit") {
            const item = draft.lodgings.find((entry) => entry.id === state.modal.id);
            if (item) Object.assign(item, payload);
          } else {
            draft.lodgings.push({ id: crypto.randomUUID(), ...payload });
          }
          return draft;
        });
        state.modal = null;
        render();
      });

      root.querySelector("[data-transport-form]")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = formToObject(event.currentTarget);
        state.store = updateActiveTrip(state.store, (draft) => {
          const payload = createTransportPayload(data);
          if (state.modal.mode === "edit") {
            const item = draft.transportItems.find((entry) => entry.id === state.modal.id);
            if (item) Object.assign(item, payload);
          } else {
            draft.transportItems.push({
              id: crypto.randomUUID(),
              ...payload,
              ...(payload.type === "rental-car" ? { rentalChecklist: normalizeRentalChecklist([]) } : {}),
            });
          }
          return draft;
        });
        state.modal = null;
        render();
      });

      root.querySelector("[data-parking-photo-camera]")?.addEventListener("click", () => {
        root.querySelector("[data-parking-photo-input]")?.click();
      });
      root.querySelector("[data-parking-photo-input]")?.addEventListener("change", (event) => {
        void handleParkingPhotoFile(event.target.files?.[0], root, trip);
      });

      if (state.itinerarySection === "days") void ensureWeatherLoaded(trip, render);
    },
  };
}

function renderDaySelector(trip, days, activeDay) {
  return `
    <section class="panel span-all itinerary-day-tabs-panel">
      <div class="itinerary-day-tabs">
        ${days.map((day, index) => {
          const places = trip.places.filter((place) => place.dayId === day.id);
          return `
            <button class="itinerary-day-tab ${day.id === activeDay?.id ? "is-active" : ""}" type="button" data-itinerary-day-tab="${day.id}">
              <span>Day ${index + 1}</span>
              <strong>${escapeHtml(day.date?.slice(5) || "")}</strong>
              <small>${places.length} ${T.station}</small>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderDay(day, trip) {
  if (!day) return `<section class="panel span-all"><div class="empty">${T.noData}</div></section>`;
  const places = trip.places.filter((place) => place.dayId === day.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const dayIndex = getSortedDays(trip).findIndex((entry) => entry.id === day.id);
  return `
    <section class="span-all itinerary-days">
      ${renderWeatherOutfit(day, dayIndex)}
      <article class="itinerary-day-card">
        <div class="itinerary-day-header">
          <div><span>${escapeHtml(day.date)}</span></div>
          <strong>${places.length} ${T.station}</strong>
        </div>
        <div class="itinerary-timeline">${places.map((place, index) => renderPlace(place, places[index + 1], index, places.length)).join("") || `<div class="empty">${T.noData}</div>`}</div>
      </article>
    </section>
  `;
}

function renderWeatherOutfit(day, dayIndex) {
  const weather = getDailyWeather(day, dayIndex, state.weatherByDate);
  return `
    <article class="weather-outfit-card">
      <div class="weather-copy">
        <div class="weather-card-head">
          <span>${T.dailyWeather}</span>
          <button class="action-pill weather-refresh-button" type="button" data-refresh-weather>${T.weatherRefresh}</button>
        </div>
        <h3>${escapeHtml(weather.condition)}</h3>
        <p>${escapeHtml(weather.outfitAdvice)}</p>
        ${state.weatherStatus === "loading" ? `<small>${T.weatherLoading}</small>` : ""}
        ${state.weatherError ? `<small class="danger-text">${escapeHtml(state.weatherError)}</small>` : ""}
        ${weather.available && weather.source === "Open-Meteo" ? `<small><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">${T.weatherSource}</a></small>` : ""}
      </div>
      <div class="weather-stats">
        <span><strong>${escapeHtml(weather.temperature)}</strong><em>${T.temperature}</em></span>
        <span><strong>${escapeHtml(weather.rainChance)}</strong><em>${T.rainChance}</em></span>
        <span><strong>${escapeHtml(weather.windSpeed || "待更新")}</strong><em>${T.windSpeed}</em></span>
      </div>
    </article>
  `;
}

function renderDepartureReminder(reminder) {
  return `
    <aside class="departure-reminder span-all">
      <span>${T.departureReminder}</span>
      <strong>${escapeHtml(reminder.message)}</strong>
    </aside>
  `;
}

function renderPlace(place, nextPlace, index, totalPlaces) {
  const mapUrls = buildMapProviderUrls(place, [place.name, place.address]);
  const mood = getMood(place.moodId);
  return `
    <div class="timeline-place-row">
      <div class="timeline-rail"><span class="timeline-dot">${index + 1}</span>${nextPlace ? `<span class="timeline-line"></span>` : ""}</div>
      <div class="timeline-place-card ${mood ? "has-mood" : ""}">
        <div class="place-copy">
          <div class="place-title-row">
            <h3>${escapeHtml(place.name)}</h3>
            ${mood ? renderMoodBadge(mood) : ""}
          </div>
          <p>${escapeHtml(place.address || "")}</p>
          <small>${escapeHtml(place.notes || "")}</small>
          ${renderMoodStrip(place)}
        </div>
        <div class="place-side">
          <div class="place-side-actions">
            <button class="map-icon-button" type="button" data-move-place="${place.id}" data-move-direction="up" aria-label="${T.moveUp}" ${index === 0 ? "disabled" : ""}>${arrowUpIcon()}</button>
            <button class="map-icon-button" type="button" data-move-place="${place.id}" data-move-direction="down" aria-label="${T.moveDown}" ${index >= totalPlaces - 1 ? "disabled" : ""}>${arrowDownIcon()}</button>
            <a class="map-icon-button" href="${escapeHtml(mapUrls.google)}" target="_blank" rel="noreferrer" aria-label="${T.openMap}">${mapIcon()}</a>
            <a class="map-icon-button naver-map-button" href="${escapeHtml(mapUrls.naver)}" target="_blank" rel="noreferrer" aria-label="${T.openNaverMap}">N</a>
            <button class="action-pill" type="button" data-edit-place="${place.id}">${T.edit}</button>
            <button class="action-pill danger" type="button" data-delete-place="${place.id}">${T.delete}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLodgings(trip) {
  return `
    <section class="panel span-all lodging-panel">
      <div class="section-title"><h2>${T.lodging}</h2></div>
      <div class="lodging-list">
        ${trip.lodgings.map(renderLodgingCard).join("") || `<div class="empty">${T.noData}</div>`}
      </div>
    </section>
  `;
}

function renderLodgingCard(item) {
  const mapUrls = buildMapProviderUrls(item, [item.name, item.address]);
  return `
    <article class="lodging-card">
      <div class="lodging-main">
        <span class="pill">${formatDateShort(item.checkInAt)} → ${formatDateShort(item.checkOutAt)}</span>
        <h3>${escapeHtml(item.name || T.lodging)}</h3>
        <p>${escapeHtml(item.address || "")}</p>
        <div class="meta-row">
          ${item.bookingSource ? `<span>${escapeHtml(item.bookingSource)}</span>` : ""}
          ${item.confirmationCode ? `<span>${escapeHtml(item.confirmationCode)}</span>` : ""}
          ${item.contact ? `<span>${escapeHtml(item.contact)}</span>` : ""}
        </div>
        ${item.notes ? `<small>${escapeHtml(item.notes)}</small>` : ""}
      </div>
      <div class="place-side-actions">
        <a class="map-icon-button" href="${escapeHtml(mapUrls.google)}" target="_blank" rel="noreferrer" aria-label="${T.openMap}">${mapPinIcon()}</a>
        <a class="map-icon-button naver-map-button" href="${escapeHtml(mapUrls.naver)}" target="_blank" rel="noreferrer" aria-label="${T.openNaverMap}">N</a>
        <button class="action-pill" type="button" data-edit-lodging="${item.id}">${T.edit}</button>
        <button class="action-pill danger" type="button" data-delete-lodging="${item.id}">${T.delete}</button>
      </div>
    </article>
  `;
}

function renderTransports(trip) {
  return `
    <section class="panel span-all transport-panel">
      <div class="section-title"><h2>${T.transport}</h2></div>
      <div class="transport-list">
        ${trip.transportItems.map(renderTransportCard).join("") || `<div class="empty">${T.noData}</div>`}
      </div>
    </section>
  `;
}

function renderTransportCard(item) {
  const type = getTransportType(item.type);
  if (type.id === "flight") return renderFlightCard(item, type);
  if (type.id === "taxi") return renderTaxiCard(item, type);
  if (type.id === "custom") return renderCustomTransportCard(item, type);
  return renderRentalCarCard(item, type);
}

function renderFlightCard(item, type) {
  const title = getFlightTitle(item);
  const origin = getFlightEndpoint(item, "origin");
  const destination = getFlightEndpoint(item, "destination");
  return `
    <article class="transport-card flight-card">
      <button class="transport-card-main" type="button" data-view-transport="${item.id}" aria-label="${T.viewDetail}">
        <div class="transport-card-head">
          <span class="transport-icon">${type.icon()}</span>
          <div><span class="pill">${T.flightInfo}</span><h3>${escapeHtml(title)}</h3></div>
        </div>
        ${renderFlightRoute(item, origin, destination)}
        <div class="transport-mini-grid">
          ${detail(T.baggage, item.baggage)}
          ${detail(T.aircraft, item.aircraft)}
          ${detail(T.price, item.price)}
          ${detail(T.purchasedAt, item.purchasedAt)}
        </div>
      </button>
      ${renderTransportActions(item)}
    </article>
  `;
}

function renderRentalCarCard(item, type) {
  const title = item.rentalCompany || item.provider || T.rentalCar;
  const mapUrls = buildMapProviderUrls(item, [item.pickupLocation || item.origin || title, item.pickupAddress]);
  const checklist = normalizeRentalChecklist(item.rentalChecklist);
  const completedChecks = checklist.filter((entry) => entry.checked).length;
  return `
    <article class="transport-card rental-card">
      <button class="transport-card-main" type="button" data-view-transport="${item.id}" aria-label="${T.viewDetail}">
        <div class="transport-card-head">
          <span class="transport-icon">${type.icon()}</span>
          <div><span class="pill">${T.rentalInfo}</span><h3>${escapeHtml(title)}</h3></div>
        </div>
        <div class="transport-ticket-card">
          <div class="ticket-route compact">
            <div><span>${T.pickupLocation}</span><strong>${escapeHtml(item.pickupLocation || item.origin || "")}</strong><small>${escapeHtml(formatDateTime(item.pickupAt || item.departAt))}</small></div>
            <div class="ticket-line">${carIcon()}</div>
            <div><span>${T.returnLocation}</span><strong>${escapeHtml(item.returnLocation || item.destination || "")}</strong><small>${escapeHtml(formatDateTime(item.returnAt || item.arriveAt))}</small></div>
          </div>
        </div>
        <div class="transport-mini-grid">
          ${detail(T.rentalRate, item.rentalRate)}
          ${detail(T.plateNumber, item.plateNumber || item.code)}
          ${detail(T.fuelInfo, item.fuelInfo)}
          ${detail(T.pickupAddress, item.pickupAddress)}
        </div>
        ${renderParkingSummary(item)}
        <div class="rental-checklist-progress">
          <span>${T.rentalChecklist}</span>
          <strong>${completedChecks}/${checklist.length} ${T.checklistProgress}</strong>
        </div>
      </button>
      <div class="transport-actions">
        <a class="map-icon-button" href="${escapeHtml(mapUrls.google)}" target="_blank" rel="noreferrer" aria-label="${T.openMap}">${mapPinIcon()}</a>
        <a class="map-icon-button naver-map-button" href="${escapeHtml(mapUrls.naver)}" target="_blank" rel="noreferrer" aria-label="${T.openNaverMap}">N</a>
        ${transportActionButtons(item)}
      </div>
    </article>
  `;
}

function renderTaxiCard(item, type) {
  const title = item.taxiCompany || item.provider || T.taxi;
  const mapUrls = buildMapProviderUrls(item, [item.pickupLocation || item.origin || title, item.dropoffLocation || item.destination]);
  return `
    <article class="transport-card taxi-card">
      <button class="transport-card-main" type="button" data-view-transport="${item.id}" aria-label="${T.viewDetail}">
        <div class="transport-card-head">
          <span class="transport-icon">${type.icon()}</span>
          <div><span class="pill">${T.taxiInfo}</span><h3>${escapeHtml(title)}</h3></div>
        </div>
        <div class="transport-ticket-card">
          <div class="ticket-route compact">
            <div><span>${T.taxiPickupLocation}</span><strong>${escapeHtml(item.pickupLocation || item.origin || "")}</strong><small>${escapeHtml(formatDateTime(item.pickupAt || item.departAt))}</small></div>
            <div class="ticket-line">${taxiIcon()}</div>
            <div><span>${T.dropoffLocation}</span><strong>${escapeHtml(item.dropoffLocation || item.destination || "")}</strong><small>${escapeHtml(item.estimatedFare || item.price || "")}</small></div>
          </div>
        </div>
        <div class="transport-mini-grid">
          ${detail(T.estimatedFare, item.estimatedFare || item.price)}
          ${detail(T.driverContact, item.driverContact || item.contact)}
          ${detail(T.bookingCode, item.bookingCode || item.code)}
        </div>
      </button>
      <div class="transport-actions">
        <a class="map-icon-button" href="${escapeHtml(mapUrls.google)}" target="_blank" rel="noreferrer" aria-label="${T.openMap}">${mapPinIcon()}</a>
        <a class="map-icon-button naver-map-button" href="${escapeHtml(mapUrls.naver)}" target="_blank" rel="noreferrer" aria-label="${T.openNaverMap}">N</a>
        ${transportActionButtons(item)}
      </div>
    </article>
  `;
}

function renderParkingSummary(item) {
  if (!hasParkingInfo(item)) return "";
  const parkingText = joinText(item.parkingName, item.parkingLocation, item.parkingLevel);
  return `
    <div class="parking-summary">
      <span class="transport-icon small">${parkingIcon()}</span>
      <div>
        <strong>${T.parkingInfo}</strong>
        <p>${escapeHtml(parkingText || T.noData)}</p>
      </div>
    </div>
  `;
}

function renderCustomTransportCard(item, type) {
  const title = item.title || item.provider || item.customCategoryName || T.customInfo;
  const mapUrls = buildMapProviderUrls(item, [item.origin || title, item.destination]);
  return `
    <article class="transport-card custom-transport-card">
      <button class="transport-card-main" type="button" data-view-transport="${item.id}" aria-label="${T.viewDetail}">
        <div class="transport-card-head">
          <span class="transport-icon">${type.icon()}</span>
          <div><span class="pill">${escapeHtml(item.customCategoryName || T.custom)}</span><h3>${escapeHtml(title)}</h3></div>
        </div>
        <div class="transport-mini-grid">
          ${detail(T.dateTime, formatDateTime(item.departAt))}
          ${detail(T.startPoint, item.origin)}
          ${detail(T.destination, item.destination)}
          ${detail(T.amount, item.price)}
          ${detail(T.bookingCode, item.bookingCode || item.code)}
        </div>
      </button>
      <div class="transport-actions">
        <a class="map-icon-button" href="${escapeHtml(mapUrls.google)}" target="_blank" rel="noreferrer" aria-label="${T.openMap}">${mapPinIcon()}</a>
        <a class="map-icon-button naver-map-button" href="${escapeHtml(mapUrls.naver)}" target="_blank" rel="noreferrer" aria-label="${T.openNaverMap}">N</a>
        ${transportActionButtons(item)}
      </div>
    </article>
  `;
}

function renderFlightRoute(item, origin = getFlightEndpoint(item, "origin"), destination = getFlightEndpoint(item, "destination")) {
  return `
    <div class="transport-ticket-card flight-ticket-summary">
      <div class="ticket-route">
        <div>
          <span>${escapeHtml(origin.secondary)}</span>
          <strong class="${origin.isCode ? "" : "is-name"}">${escapeHtml(origin.primary)}</strong>
          <small>${escapeHtml(formatTime(item.departAt))}</small>
        </div>
        <div class="ticket-line">
          <em>${escapeHtml(item.duration || "")}</em>
          ${planeIcon()}
        </div>
        <div>
          <span>${escapeHtml(destination.secondary)}</span>
          <strong class="${destination.isCode ? "" : "is-name"}">${escapeHtml(destination.primary)}</strong>
          <small>${escapeHtml(formatTime(item.arriveAt))}</small>
        </div>
      </div>
    </div>
  `;
}

function renderTransportActions(item) {
  return `<div class="transport-actions">${transportActionButtons(item)}</div>`;
}

function transportActionButtons(item) {
  return `
    <button class="action-pill" type="button" data-edit-transport="${item.id}">${T.edit}</button>
    <button class="action-pill danger" type="button" data-delete-transport="${item.id}">${T.delete}</button>
  `;
}

function renderMoodBadge(mood) {
  return `<span class="mood-badge"><img src="${escapeHtml(mood.iconUrl)}" alt="" /><span>${escapeHtml(mood.label)}</span></span>`;
}

function renderMoodStrip(place) {
  return `
    <div class="mood-strip" aria-label="${T.chooseMood}">
      ${TRIP_MOODS.map((mood) => `
        <button class="mood-chip ${place.moodId === mood.id ? "is-active" : ""}" type="button" data-place-id="${place.id}" data-place-mood="${mood.id}" title="${escapeHtml(mood.label)}">
          <img src="${escapeHtml(mood.iconUrl)}" alt="" />
          <span>${escapeHtml(mood.label)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderSheet(trip) {
  if (state.modal?.type !== "itinerary") return "";
  if (state.modal.entity === "lodging") return renderLodgingSheet(trip);
  if (state.modal.entity === "transport") return renderTransportSheet(trip);
  if (state.modal.entity === "transport-detail") return renderTransportDetailSheet(trip);
  return renderPlaceSheet(trip);
}

function renderPlaceSheet(trip) {
  const activeDay = getActiveDay(trip);
  const editing = state.modal.mode === "edit" ? trip.places.find((place) => place.id === state.modal.id) : null;
  const title = editing ? T.editPlace : T.addPlace;
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet">
        <div class="sheet-head"><h2>${title}</h2><button class="action-pill" type="button" data-close-sheet>${T.close}</button></div>
        <form class="form-grid smart-sheet" data-place-form>
          <button class="button secondary full" type="button" data-map-search-form>${T.mapSearch}</button>
          ${fieldSelect(T.day, "dayId", getSortedDays(trip).map((day) => ({ value: day.id, label: day.date })), editing?.dayId || activeDay?.id)}
          ${field(T.placeName, "name", editing?.name, { placeholder: "Olive Young Jeju Tapdong Branch", required: true })}
          ${field(T.address, "address", editing?.address, { placeholder: "Google Maps 景點名稱或地址" })}
          ${renderMapSearchFields(editing)}
          ${fieldSelect(T.mood, "moodId", [{ value: "", label: T.noMood }, ...TRIP_MOODS.map((mood) => ({ value: mood.id, label: mood.label }))], editing?.moodId || "")}
          ${fieldTextarea(T.notes, "notes", editing?.notes)}
          <button class="button primary full" type="submit">${T.save}</button>
        </form>
      </section>
    </div>
  `;
}

function renderLodgingSheet(trip) {
  const editing = state.modal.mode === "edit" ? trip.lodgings.find((item) => item.id === state.modal.id) : null;
  const title = editing ? T.editLodging : T.addLodging;
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet">
        <div class="sheet-head"><h2>${title}</h2><button class="action-pill" type="button" data-close-sheet>${T.close}</button></div>
        <form class="form-grid smart-sheet" data-lodging-form>
          <button class="button secondary full" type="button" data-map-search-form>${T.mapSearch}</button>
          ${field(T.lodging, "name", editing?.name, { placeholder: "Bayview Hotel Jeju", required: true })}
          ${field(T.address, "address", editing?.address)}
          ${renderMapSearchFields(editing)}
          <div class="form-row">
            ${field(T.checkIn, "checkInAt", toDatetimeLocal(editing?.checkInAt), { type: "datetime-local" })}
            ${field(T.checkOut, "checkOutAt", toDatetimeLocal(editing?.checkOutAt), { type: "datetime-local" })}
          </div>
          <div class="form-row">
            ${field(T.bookingSource, "bookingSource", editing?.bookingSource, { placeholder: "Agoda / Booking.com" })}
            ${field(T.confirmation, "confirmationCode", editing?.confirmationCode)}
          </div>
          ${field(T.contact, "contact", editing?.contact)}
          ${fieldTextarea(T.notes, "notes", editing?.notes)}
          <button class="button primary full" type="submit">${T.save}</button>
        </form>
      </section>
    </div>
  `;
}

function renderTransportSheet(trip) {
  const editing = state.modal.mode === "edit" ? trip.transportItems.find((item) => item.id === state.modal.id) : null;
  if (!editing && !state.modal.transportType) return renderTransportTypeSheet();

  const type = getTransportType(editing?.type || state.modal.transportType);
  const title = editing ? T.editTransport : `${T.addTransport} ・ ${type.label}`;
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet transport-sheet">
        <div class="sheet-head"><h2>${title}</h2><button class="action-pill" type="button" data-close-sheet>${T.close}</button></div>
        <form class="form-grid smart-sheet transport-form" data-transport-form>
          <input type="hidden" name="type" value="${escapeHtml(type.id)}" />
          <div class="transport-form-banner">
            <span class="transport-icon">${type.icon()}</span>
            <div><strong>${escapeHtml(type.label)}</strong><small>${escapeHtml(type.description)}</small></div>
          </div>
          ${type.id === "flight" ? renderFlightForm(editing) : ""}
          ${type.id === "rental-car" ? renderRentalCarForm(editing) : ""}
          ${type.id === "taxi" ? renderTaxiForm(editing) : ""}
          ${type.id === "custom" ? renderCustomTransportForm(editing) : ""}
          ${fieldTextarea(T.notes, "notes", editing?.notes)}
          <button class="button primary full" type="submit">${T.save}</button>
        </form>
      </section>
    </div>
  `;
}

function renderTransportTypeSheet() {
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet transport-type-sheet">
        <div class="sheet-head"><div><h2>${T.chooseTransport}</h2><p>${T.chooseTransportHint}</p></div><button class="action-pill" type="button" data-close-sheet>${T.close}</button></div>
        <div class="transport-type-grid">
          ${TRANSPORT_TYPES.map((type) => `
            <button class="transport-type-card" type="button" data-transport-type-choice="${type.id}">
              <span class="transport-icon">${type.icon()}</span>
              <strong>${escapeHtml(type.label)}</strong>
              <small>${escapeHtml(type.description)}</small>
            </button>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderFlightForm(editing) {
  return `
    <div class="form-row">
      ${field(T.airline, "airline", editing?.airline || editing?.provider, { placeholder: "United Airlines" })}
      ${field(T.flightNo, "flightNo", editing?.flightNo || editing?.code, { placeholder: "UA166" })}
    </div>
    <div class="form-row">
      ${field(T.originCode, "originCode", editing?.originCode || editing?.origin, { placeholder: "TPE" })}
      ${field(T.destinationCode, "destinationCode", editing?.destinationCode || editing?.destination, { placeholder: "CJU" })}
    </div>
    <div class="form-row">
      ${field(T.originCity, "originCity", editing?.originCity, { placeholder: "Taipei" })}
      ${field(T.destinationCity, "destinationCity", editing?.destinationCity, { placeholder: "Jeju" })}
    </div>
    <div class="form-row">
      ${field(T.departAt, "flightDepartAt", toDatetimeLocal(editing?.departAt), { type: "datetime-local" })}
      ${field(T.arriveAt, "flightArriveAt", toDatetimeLocal(editing?.arriveAt), { type: "datetime-local" })}
    </div>
    <div class="form-row">
      ${field(T.departureTerminal, "departureTerminal", editing?.departureTerminal)}
      ${field(T.arrivalTerminal, "arrivalTerminal", editing?.arrivalTerminal)}
    </div>
    <div class="form-row">
      ${field(T.duration, "duration", editing?.duration, { placeholder: "3h 50m" })}
      ${field(T.baggage, "baggage", editing?.baggage, { placeholder: "23kg * 2" })}
    </div>
    <div class="form-row">
      ${field(T.aircraft, "aircraft", editing?.aircraft, { placeholder: "Boeing737-800" })}
      ${field(T.price, "price", editing?.price, { placeholder: "NT$23,168" })}
    </div>
    <div class="form-row">
      ${field(T.purchasedAt, "purchasedAt", toDateInput(editing?.purchasedAt), { type: "date" })}
      ${field(T.bookingCode, "flightBookingCode", editing?.bookingCode)}
    </div>
  `;
}

function renderRentalCarForm(editing) {
  const parkingPhotoUrl = editing?.parkingPhotoUrl || "";
  return `
    ${field(T.rentalCompany, "rentalCompany", editing?.rentalCompany || editing?.provider, { placeholder: "Lotte Rent-a-Car" })}
    <div class="form-row">
      ${field(T.pickupLocation, "pickupLocation", editing?.pickupLocation || editing?.origin, { placeholder: "濟州國際機場" })}
      ${field(T.returnLocation, "returnLocation", editing?.returnLocation || editing?.destination, { placeholder: "濟州國際機場" })}
    </div>
    <div class="form-row">
      ${field(T.pickupAt, "pickupAt", toDatetimeLocal(editing?.pickupAt || editing?.departAt), { type: "datetime-local" })}
      ${field(T.returnAt, "returnAt", toDatetimeLocal(editing?.returnAt || editing?.arriveAt), { type: "datetime-local" })}
    </div>
    ${field(T.pickupAddress, "pickupAddress", editing?.pickupAddress)}
    ${renderMapSearchFields(editing)}
    <div class="form-row">
      ${field(T.rentalRate, "rentalRate", editing?.rentalRate, { placeholder: "KRW 80,000 / day" })}
      ${field(T.plateNumber, "plateNumber", editing?.plateNumber || editing?.code)}
    </div>
    ${field(T.fuelInfo, "fuelInfo", editing?.fuelInfo, { placeholder: "滿油取還 / 附近加油站" })}
    <div class="transport-form-section-title">${T.parkingInfo}</div>
    <div class="form-row">
      ${field(T.parkingName, "parkingName", editing?.parkingName, { placeholder: "機場 B1 停車場" })}
      ${field(T.parkingLevel, "parkingLevel", editing?.parkingLevel, { placeholder: "B1 / C區 / 12號" })}
    </div>
    ${field(T.parkingLocation, "parkingLocation", editing?.parkingLocation, { placeholder: "可填地址或 Google Maps 地標" })}
    <input type="hidden" name="parkingPhotoUrl" value="${escapeHtml(parkingPhotoUrl)}" />
    <input type="hidden" name="parkingPhotoPath" value="${escapeHtml(editing?.parkingPhotoPath || "")}" />
    <input type="hidden" name="parkingPhotoProvider" value="${escapeHtml(editing?.parkingPhotoProvider || "")}" />
    <div class="parking-photo-tools">
      <button class="button secondary full" type="button" data-parking-photo-camera>${cameraIcon()} ${T.captureParkingPhoto}</button>
      <input class="visually-hidden" type="file" accept="image/*" capture="environment" data-parking-photo-input />
      <div class="parking-photo-upload-preview ${parkingPhotoUrl ? "has-photo" : ""}" data-parking-photo-upload-preview>
        ${parkingPhotoUrl ? `<img src="${escapeHtml(parkingPhotoUrl)}" alt="${T.parkingInfo}" />` : `<span>${T.uploadParkingPhoto}</span>`}
        <small data-parking-photo-status></small>
      </div>
    </div>
  `;
}

function renderTaxiForm(editing) {
  return `
    ${field(T.taxiCompany, "taxiCompany", editing?.taxiCompany || editing?.provider, { placeholder: "Kakao T / 預約車行" })}
    <div class="form-row">
      ${field(T.taxiPickupLocation, "taxiPickupLocation", editing?.pickupLocation || editing?.origin)}
      ${field(T.dropoffLocation, "dropoffLocation", editing?.dropoffLocation || editing?.destination)}
    </div>
    <div class="form-row">
      ${field(T.taxiPickupAt, "taxiPickupAt", toDatetimeLocal(editing?.pickupAt || editing?.departAt), { type: "datetime-local" })}
      ${field(T.estimatedFare, "estimatedFare", editing?.estimatedFare || editing?.price)}
    </div>
    <div class="form-row">
      ${field(T.driverContact, "driverContact", editing?.driverContact || editing?.contact)}
      ${field(T.bookingCode, "taxiBookingCode", editing?.bookingCode || editing?.code)}
    </div>
    ${renderMapSearchFields(editing)}
  `;
}

function renderCustomTransportForm(editing) {
  return `
    <div class="form-row">
      ${field(T.customCategoryName, "customCategoryName", editing?.customCategoryName || editing?.provider, { placeholder: "公車 / 接駁 / 船票" })}
      ${field(T.title, "customTitle", editing?.title || editing?.provider, { placeholder: "機場接駁" })}
    </div>
    <div class="form-row">
      ${field(T.dateTime, "customDepartAt", toDatetimeLocal(editing?.departAt), { type: "datetime-local" })}
      ${field(T.amount, "customPrice", editing?.price)}
    </div>
    <div class="form-row">
      ${field(T.startPoint, "customOrigin", editing?.origin)}
      ${field(T.destination, "customDestination", editing?.destination)}
    </div>
    ${renderMapSearchFields(editing)}
    ${field(T.bookingCode, "customBookingCode", editing?.bookingCode || editing?.code)}
  `;
}

function renderMapSearchFields(editing) {
  return `
    <div class="transport-form-section-title">${T.mapSearchInfo}</div>
    <p class="form-help">${T.mapSearchHint}</p>
    ${field(T.googleMapQuery, "googleMapQuery", editing?.googleMapQuery, { placeholder: "152-11 Gwangnyeongpyeonghwa 2-gil, Aewol-eup, Jeju-si" })}
    ${field(T.naverMapQuery, "naverMapQuery", editing?.naverMapQuery, { placeholder: "제주특별자치도 제주시 애월읍 광령평화2길 152-11 118동" })}
    ${field(T.naverMapUrl, "naverMapUrl", editing?.naverMapUrl, { placeholder: "https://map.naver.com/..." })}
  `;
}

function renderTransportDetailSheet(trip) {
  const item = trip.transportItems.find((entry) => entry.id === state.modal.id);
  if (!item) return "";
  const type = getTransportType(item.type);
  const title = getTransportTitle(item);
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet ticket-detail-sheet">
        <div class="ticket-detail-head">
          <div><span>${escapeHtml(type.label)}</span><h2>${escapeHtml(title)}</h2></div>
          <button class="action-pill" type="button" data-close-sheet>${T.close}</button>
        </div>
        ${type.id === "flight" ? renderFlightDetail(item) : renderGroundTransportDetail(item, type)}
        <div class="ticket-notes">
          <span>${T.notes}</span>
          <p>${escapeHtml(item.notes || T.noNotes)}</p>
        </div>
        <button class="button secondary full" type="button" data-edit-transport="${item.id}">${editLabel(type.id)}</button>
      </section>
    </div>
  `;
}

function renderFlightDetail(item) {
  const origin = getFlightEndpoint(item, "origin");
  const destination = getFlightEndpoint(item, "destination");
  return `
    <div class="ticket-hero flight-detail-hero">
      <div class="boarding-pass-head">
        <span>${escapeHtml(getFlightAirline(item))}</span>
        <strong>${escapeHtml(getFlightNumber(item))}</strong>
      </div>
      <div class="boarding-pass-route">
        <div>
          <strong class="${origin.isCode ? "" : "is-name"}">${escapeHtml(origin.primary)}</strong>
          <span>${escapeHtml(origin.secondary)}</span>
          <em>${escapeHtml(formatTime(item.departAt))}</em>
        </div>
        <div class="boarding-pass-line">
          <span>${escapeHtml(item.duration || "")}</span>
          ${planeIcon()}
          <small>${escapeHtml(formatDateOnly(item.departAt))}</small>
        </div>
        <div>
          <strong class="${destination.isCode ? "" : "is-name"}">${escapeHtml(destination.primary)}</strong>
          <span>${escapeHtml(destination.secondary)}</span>
          <em>${escapeHtml(formatTime(item.arriveAt))}</em>
        </div>
      </div>
    </div>
    <div class="ticket-meta-grid">
      ${detail(T.date, formatDateOnly(item.departAt))}
      ${detail(T.duration, item.duration)}
      ${detail(T.terminal, joinText(item.departureTerminal, item.arrivalTerminal))}
      ${detail(T.baggage, item.baggage)}
      ${detail(T.aircraft, item.aircraft)}
      ${detail(T.price, item.price)}
      ${detail(T.purchasedAt, item.purchasedAt)}
      ${detail(T.bookingCode, item.bookingCode || item.code)}
    </div>
  `;
}

function renderGroundTransportDetail(item, type) {
  return `
    <div class="ticket-hero ground-ticket-hero">
      <span>${escapeHtml(type.label)}</span>
      <strong>${escapeHtml(getTransportTitle(item))}</strong>
      <div class="transport-ticket-card">
        <div class="ticket-route compact">
          <div><span>${T.startPoint}</span><strong>${escapeHtml(item.pickupLocation || item.origin || "")}</strong><small>${escapeHtml(formatDateTime(item.pickupAt || item.departAt))}</small></div>
          <div class="ticket-line">${type.icon()}</div>
          <div><span>${T.destination}</span><strong>${escapeHtml(item.returnLocation || item.dropoffLocation || item.destination || "")}</strong><small>${escapeHtml(formatDateTime(item.returnAt || item.arriveAt) || item.estimatedFare || item.price || "")}</small></div>
        </div>
      </div>
    </div>
    <div class="ticket-meta-grid">
      ${type.id === "rental-car" ? renderRentalDetailItems(item) : ""}
      ${type.id === "taxi" ? renderTaxiDetailItems(item) : ""}
      ${type.id === "custom" ? renderCustomDetailItems(item) : ""}
    </div>
    ${type.id === "rental-car" ? renderParkingDetail(item) : ""}
    ${type.id === "rental-car" ? renderRentalChecklist(item) : ""}
  `;
}

function renderRentalDetailItems(item) {
  return `
    ${detail(T.rentalCompany, item.rentalCompany || item.provider)}
    ${detail(T.pickupAddress, item.pickupAddress)}
    ${detail(T.rentalRate, item.rentalRate)}
    ${detail(T.plateNumber, item.plateNumber || item.code)}
    ${detail(T.fuelInfo, item.fuelInfo)}
    ${detail(T.bookingCode, item.bookingCode)}
  `;
}

function renderParkingDetail(item) {
  if (!hasParkingInfo(item)) return "";
  const searchQuery = buildPlaceSearchQuery(item.parkingName, item.parkingLocation);
  const googleMapUrl = buildGoogleMapsSearchUrl(item.parkingName, item.parkingLocation);
  const naverMapUrl = buildNaverMapSearchUrl(item.parkingName, item.parkingLocation);
  return `
    <div class="parking-detail-card">
      <div class="parking-detail-copy">
        <span>${T.parkingInfo}</span>
        <h3>${escapeHtml(item.parkingName || T.parkingLocation)}</h3>
        <p>${escapeHtml(joinText(item.parkingLocation, item.parkingLevel) || T.noData)}</p>
        ${searchQuery ? `<div class="meta-row"><a class="button secondary" href="${googleMapUrl}" target="_blank" rel="noreferrer">${T.openParkingMap}</a><a class="button secondary" href="${naverMapUrl}" target="_blank" rel="noreferrer">${T.openNaverMap}</a></div>` : ""}
      </div>
      ${item.parkingPhotoUrl ? `<a class="parking-photo-preview" href="${escapeHtml(item.parkingPhotoUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(item.parkingPhotoUrl)}" alt="${T.parkingInfo}" /></a>` : ""}
    </div>
  `;
}

function renderRentalChecklist(item) {
  const checklist = normalizeRentalChecklist(item.rentalChecklist);
  const completed = checklist.filter((entry) => entry.checked).length;
  return `
    <section class="rental-checklist-card">
      <div class="rental-checklist-head">
        <div><span>${T.rentalChecklist}</span><strong>${completed}/${checklist.length} ${T.checklistProgress}</strong></div>
        <em style="--check-progress:${Math.round((completed / checklist.length) * 100)}%"></em>
      </div>
      <div class="rental-checklist-list">
        ${checklist.map((entry) => `
          <label class="rental-checklist-row ${entry.checked ? "is-checked" : ""}">
            <input type="checkbox" data-rental-check="${escapeHtml(entry.id)}" data-transport-id="${escapeHtml(item.id)}" ${entry.checked ? "checked" : ""} />
            <span>${escapeHtml(entry.label)}</span>
          </label>
        `).join("")}
      </div>
    </section>
  `;
}

function renderTaxiDetailItems(item) {
  return `
    ${detail(T.taxiCompany, item.taxiCompany || item.provider)}
    ${detail(T.estimatedFare, item.estimatedFare || item.price)}
    ${detail(T.driverContact, item.driverContact || item.contact)}
    ${detail(T.bookingCode, item.bookingCode || item.code)}
  `;
}

function renderCustomDetailItems(item) {
  return `
    ${detail(T.customCategoryName, item.customCategoryName || item.provider)}
    ${detail(T.amount, item.price)}
    ${detail(T.bookingCode, item.bookingCode || item.code)}
  `;
}

function createPlacePayload(data) {
  return {
    dayId: data.dayId,
    name: data.name,
    address: data.address,
    ...mapSearchPayload(data),
    notes: data.notes,
    moodId: normalizeMoodId(data.moodId),
  };
}

function createLodgingPayload(data) {
  return {
    name: data.name,
    address: data.address,
    ...mapSearchPayload(data),
    checkInAt: data.checkInAt,
    checkOutAt: data.checkOutAt,
    bookingSource: data.bookingSource,
    confirmationCode: data.confirmationCode,
    contact: data.contact,
    notes: data.notes,
  };
}

function createTransportPayload(data) {
  const type = normalizeTransportType(data.type);
  const common = { type, ...mapSearchPayload(data), notes: data.notes };
  if (type === "flight") {
    return {
      ...common,
      provider: data.airline,
      code: data.flightNo,
      origin: data.originCode,
      destination: data.destinationCode,
      departAt: data.flightDepartAt,
      arriveAt: data.flightArriveAt,
      airline: data.airline,
      flightNo: data.flightNo,
      originCode: data.originCode,
      originCity: data.originCity,
      destinationCode: data.destinationCode,
      destinationCity: data.destinationCity,
      departureTerminal: data.departureTerminal,
      arrivalTerminal: data.arrivalTerminal,
      duration: data.duration,
      baggage: data.baggage,
      aircraft: data.aircraft,
      price: data.price,
      purchasedAt: data.purchasedAt,
      bookingCode: data.flightBookingCode,
    };
  }
  if (type === "taxi") {
    return {
      ...common,
      provider: data.taxiCompany,
      code: data.taxiBookingCode,
      origin: data.taxiPickupLocation,
      destination: data.dropoffLocation,
      departAt: data.taxiPickupAt,
      taxiCompany: data.taxiCompany,
      pickupLocation: data.taxiPickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupAt: data.taxiPickupAt,
      estimatedFare: data.estimatedFare,
      price: data.estimatedFare,
      driverContact: data.driverContact,
      contact: data.driverContact,
      bookingCode: data.taxiBookingCode,
    };
  }
  if (type === "custom") {
    return {
      ...common,
      provider: data.customCategoryName,
      code: data.customBookingCode,
      title: data.customTitle,
      customCategoryName: data.customCategoryName,
      origin: data.customOrigin,
      destination: data.customDestination,
      departAt: data.customDepartAt,
      price: data.customPrice,
      bookingCode: data.customBookingCode,
    };
  }
  return {
    ...common,
    provider: data.rentalCompany,
    code: data.plateNumber,
    origin: data.pickupLocation,
    destination: data.returnLocation,
    departAt: data.pickupAt,
    arriveAt: data.returnAt,
    rentalCompany: data.rentalCompany,
    pickupLocation: data.pickupLocation,
    returnLocation: data.returnLocation,
    pickupAt: data.pickupAt,
    returnAt: data.returnAt,
    pickupAddress: data.pickupAddress,
    rentalRate: data.rentalRate,
    plateNumber: data.plateNumber,
    fuelInfo: data.fuelInfo,
    parkingName: data.parkingName,
    parkingLocation: data.parkingLocation,
    parkingLevel: data.parkingLevel,
    parkingPhotoUrl: data.parkingPhotoUrl,
    parkingPhotoPath: data.parkingPhotoPath,
    parkingPhotoProvider: data.parkingPhotoProvider,
  };
}

function mapSearchPayload(data) {
  return {
    googleMapQuery: data.googleMapQuery,
    naverMapQuery: data.naverMapQuery,
    naverMapUrl: data.naverMapUrl,
  };
}

function getSortedDays(trip) {
  return [...(trip.itineraryDays || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.date).localeCompare(String(b.date)));
}

function getActiveDay(trip) {
  const days = getSortedDays(trip);
  return days.find((day) => day.id === state.itineraryDayId) || days[0] || null;
}

function sectionToEntity(section) {
  if (section === "lodging") return "lodging";
  if (section === "transport") return "transport";
  return "place";
}

function addLabel(entity) {
  return { place: T.addPlace, lodging: T.addLodging, transport: T.addTransport }[entity] || T.addPlace;
}

function label(id) {
  return { days: T.dailyItinerary, lodging: T.lodging, transport: T.transport }[id] || id;
}

function editLabel(type) {
  return { flight: T.editFlight, "rental-car": T.editRental, taxi: T.editTaxi, custom: T.editCustom }[type] || T.editTransport;
}

function normalizeTransportType(type) {
  if (!type) return "rental-car";
  return TRANSPORT_TYPES.some((entry) => entry.id === type) ? type : "custom";
}

function getTransportType(type) {
  const normalized = normalizeTransportType(type);
  return TRANSPORT_TYPES.find((entry) => entry.id === normalized) || TRANSPORT_TYPES[0];
}

function getTransportTitle(item) {
  const type = normalizeTransportType(item.type);
  if (type === "flight") return getFlightTitle(item);
  if (type === "taxi") return item.taxiCompany || item.provider || T.taxiInfo;
  if (type === "custom") return item.title || item.provider || item.customCategoryName || T.customInfo;
  return item.rentalCompany || item.provider || T.rentalInfo;
}

function getFlightTitle(item) {
  return joinText(getFlightAirline(item, ""), getFlightNumber(item, "")) || T.flightInfo;
}

function getFlightAirline(item, fallback = T.flightInfo) {
  return firstUsefulFlightValue(item.airline, item.provider) || fallback;
}

function getFlightNumber(item, fallback = "") {
  return firstUsefulFlightValue(item.flightNo, item.code) || fallback;
}

function getFlightEndpoint(item, side) {
  const rawCode = side === "origin" ? item.originCode || item.origin : item.destinationCode || item.destination;
  const city = side === "origin" ? item.originCity : item.destinationCity;
  const isCode = /^[a-z0-9]{3,5}$/i.test(String(rawCode || "").trim());
  const primary = isCode ? String(rawCode).toUpperCase() : city || rawCode || T.noData;
  const secondary = isCode ? city || "" : city && city !== primary ? city : "";
  return { primary, secondary, isCode };
}

function firstUsefulFlightValue(...values) {
  return values.find((value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized
      && !["待填", "待確認", "租車", "rental", "rental-car"].includes(normalized)
      && !normalized.includes("待確認");
  }) || "";
}

function openMapSearchFromForm(form) {
  if (!form) return;
  const data = formToObject(form);
  const query = data.googleMapQuery || buildPlaceSearchQuery(
    data.name || data.rentalCompany || data.taxiPickupLocation || data.airline || data.customOrigin,
    data.address || data.pickupAddress || data.returnLocation || data.dropoffLocation || data.customDestination,
  );
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "Jeju")}`, "_blank", "noopener");
}

function hasParkingInfo(item) {
  return Boolean(item.parkingName || item.parkingLocation || item.parkingLevel || item.parkingPhotoUrl);
}

async function ensureWeatherLoaded(trip, render) {
  const tripKey = [trip.destination, trip.startDate, trip.endDate].join("|");
  if (state.weatherTripKey === tripKey && ["loading", "ready", "error"].includes(state.weatherStatus)) return;

  state.weatherTripKey = tripKey;
  state.weatherStatus = "loading";
  state.weatherError = "";
  render();

  try {
    const result = await fetchTripWeather(trip);
    if (state.weatherTripKey !== tripKey) return;
    state.weatherByDate = result.byDate;
    state.weatherLocation = result.location.name;
    state.weatherFetchedAt = result.fetchedAt;
    state.weatherStatus = "ready";
  } catch (error) {
    if (state.weatherTripKey !== tripKey) return;
    state.weatherStatus = "error";
    state.weatherError = error?.message || "即時天氣取得失敗，請稍後再試。";
  }
  render();
}

async function handleParkingPhotoFile(file, root, trip) {
  if (!file) return;
  const form = root.querySelector("[data-transport-form]");
  const preview = root.querySelector("[data-parking-photo-upload-preview]");
  const button = root.querySelector("[data-parking-photo-camera]");
  if (!form || !preview) return;

  button?.setAttribute("disabled", "");
  const initialStatus = root.querySelector("[data-parking-photo-status]");
  if (initialStatus) initialStatus.textContent = T.parkingPhotoUploading;

  let localPreviewUrl = "";
  let uploadCompleted = false;
  try {
    const image = await fileToCompressedImage(file, { maxSize: 1400, quality: 0.78 });
    localPreviewUrl = image.previewUrl;
    preview.classList.add("has-photo");
    preview.innerHTML = `<img src="${escapeHtml(localPreviewUrl)}" alt="${T.parkingInfo}" /><small data-parking-photo-status>${T.parkingPhotoUploading}</small>`;

    const draftId = state.modal?.parkingPhotoDraftId || state.modal?.id || crypto.randomUUID();
    if (state.modal) state.modal.parkingPhotoDraftId = draftId;
    const uploaded = await uploadParkingPhoto(image.blob, {
      tripId: trip.id,
      draftId,
      fileName: image.fileName,
      user: state.user,
    });

    form.elements.parkingPhotoUrl.value = uploaded.photoUrl;
    form.elements.parkingPhotoPath.value = uploaded.photoPath;
    form.elements.parkingPhotoProvider.value = uploaded.photoProvider;
    preview.innerHTML = `<img src="${escapeHtml(uploaded.photoUrl)}" alt="${T.parkingInfo}" /><small data-parking-photo-status>${T.uploadParkingPhoto}</small>`;
    uploadCompleted = true;
  } catch (error) {
    const currentStatus = root.querySelector("[data-parking-photo-status]");
    if (currentStatus) currentStatus.textContent = error?.message || T.parkingPhotoFailed;
  } finally {
    button?.removeAttribute("disabled");
    if (uploadCompleted && localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  }
}

function detail(labelText, value) {
  if (!value) return "";
  return `<div class="transport-detail"><span>${escapeHtml(labelText)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function field(labelText, name, value = "", options = {}) {
  const type = options.type || "text";
  return `
    <div class="field">
      <label>${escapeHtml(labelText)}</label>
      <input class="input" type="${type}" name="${escapeHtml(name)}" value="${escapeHtml(value || "")}" ${options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ""} ${options.inputmode ? `inputmode="${escapeHtml(options.inputmode)}"` : ""} ${options.required ? "required" : ""} />
    </div>
  `;
}

function fieldTextarea(labelText, name, value = "") {
  return `
    <div class="field">
      <label>${escapeHtml(labelText)}</label>
      <textarea class="textarea" name="${escapeHtml(name)}">${escapeHtml(value || "")}</textarea>
    </div>
  `;
}

function fieldSelect(labelText, name, options, selectedValue = "") {
  return `
    <div class="field">
      <label>${escapeHtml(labelText)}</label>
      <select class="select" name="${escapeHtml(name)}">
        ${options.map((option) => `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(selectedValue) ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
      </select>
    </div>
  `;
}

function joinText(...parts) {
  return parts.filter(Boolean).join(" ・ ");
}

function formatDateShort(value) {
  if (!value) return "";
  return String(value).replace("T", " ").slice(0, 16);
}

function formatDateOnly(value) {
  return String(value || "").slice(0, 10);
}

function formatDateTime(value) {
  return formatDateShort(value);
}

function formatTime(value) {
  const text = String(value || "");
  if (!text) return "";
  if (text.includes("T")) return text.slice(11, 16);
  const time = text.match(/\b\d{1,2}:\d{2}\b/);
  return time?.[0] || text;
}

function toDatetimeLocal(value) {
  const text = String(value || "");
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00`;
  return text.replace(" ", "T").slice(0, 16);
}

function toDateInput(value) {
  return String(value || "").slice(0, 10);
}

function mapIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>`;
}

function mapPinIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
}

function arrowUpIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>`;
}

function arrowDownIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
}

function planeIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M17.8 19.2 13 14l-3.5 7-1.6-1.6 1.5-8.2-5.7-5.7 2.2-2.2 5.7 5.7 8.2-1.5 1.6 1.6-7 3.5 5.2 4.8-1.8 1.8Z"/></svg>`;
}

function carIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 11 7 6h10l2 5"/><path d="M4 11h16v7H4z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>`;
}

function parkingIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M6 20V4h7a5 5 0 0 1 0 10H9v6"/><path d="M9 11h4a2 2 0 0 0 0-4H9v4Z"/></svg>`;
}

function taxiIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M6 11 8 6h8l2 5"/><path d="M4 11h16v7H4z"/><path d="M9 4h6"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>`;
}

function ticketIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 8a2 2 0 0 1 2-2h16v5a2 2 0 0 0 0 4v5H6a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-4V8Z"/><path d="M10 8v8"/></svg>`;
}

function cameraIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`;
}
