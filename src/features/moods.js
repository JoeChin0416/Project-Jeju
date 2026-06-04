const moodSpecs = [
  {
    id: "excited",
    label: "\u671f\u5f85",
    tone: "#ff8aa2",
    accent: "#ffd7df",
    symbol: "spark",
  },
  {
    id: "relaxed",
    label: "\u653e\u9b06",
    tone: "#62bcae",
    accent: "#dff8f2",
    symbol: "leaf",
  },
  {
    id: "shopping",
    label: "\u7206\u8cb7",
    tone: "#a88bea",
    accent: "#efe7ff",
    symbol: "bag",
  },
  {
    id: "tired",
    label: "\u7d2f\u7661",
    tone: "#8b7f91",
    accent: "#f1edf3",
    symbol: "zzz",
  },
  {
    id: "pretty",
    label: "\u8d85\u7f8e",
    tone: "#f5b15f",
    accent: "#fff0d8",
    symbol: "heart",
  },
  {
    id: "oops",
    label: "\u8e29\u96f7",
    tone: "#db4165",
    accent: "#ffe4eb",
    symbol: "angry",
  },
];

export const TRIP_MOODS = moodSpecs.map((mood) => ({
  ...mood,
  iconUrl: svgToDataUri(createMoodSvg(mood)),
}));

export function getMood(moodId) {
  return TRIP_MOODS.find((mood) => mood.id === moodId) ?? null;
}

export function normalizeMoodId(moodId) {
  return getMood(moodId)?.id || "";
}

function createMoodSvg(mood) {
  const symbol = renderSymbol(mood.symbol, mood.tone);
  const face = renderFace(mood.symbol);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="${mood.tone}" flood-opacity=".22"/>
        </filter>
      </defs>
      <g filter="url(#s)">
        <path fill="#fffdf9" d="M48 8c23 0 40 16 40 38S71 86 48 86 8 70 8 48 25 8 48 8Z"/>
        <path fill="${mood.accent}" d="M48 16c18 0 31 13 31 30S66 77 48 77 17 64 17 47s13-31 31-31Z"/>
        ${face}
        <circle cx="29" cy="53" r="5" fill="${mood.tone}" opacity=".32"/>
        <circle cx="67" cy="53" r="5" fill="${mood.tone}" opacity=".32"/>
        ${symbol}
      </g>
    </svg>
  `;
}

function renderFace(symbol) {
  if (symbol === "angry") {
    return `
      <path d="M31 39l11 5M65 39l-11 5" fill="none" stroke="#2b2430" stroke-width="4" stroke-linecap="round"/>
      <circle cx="36" cy="46" r="3.5" fill="#2b2430"/>
      <circle cx="60" cy="46" r="3.5" fill="#2b2430"/>
      <path d="M38 62c6-6 14-6 20 0" fill="none" stroke="#2b2430" stroke-width="4" stroke-linecap="round"/>
      <path d="M22 35l5-8M73 35l-5-8" fill="none" stroke="#db4165" stroke-width="4" stroke-linecap="round"/>
    `;
  }
  return `
    <circle cx="36" cy="44" r="4" fill="#2b2430"/>
    <circle cx="60" cy="44" r="4" fill="#2b2430"/>
    <path d="M36 58c7 7 17 7 24 0" fill="none" stroke="#2b2430" stroke-width="4" stroke-linecap="round"/>
  `;
}

function renderSymbol(symbol, tone) {
  const symbols = {
    spark: `<path d="M67 23l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="${tone}"/>`,
    leaf: `<path d="M66 24c-12 1-18 7-18 17 9 1 18-5 18-17Z" fill="${tone}"/><path d="M50 40c4-5 8-8 14-11" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
    bag: `<path d="M62 25h14l-2 17H64l-2-17Z" fill="${tone}"/><path d="M66 25a5 5 0 0 1 10 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    zzz: `<text x="58" y="33" fill="${tone}" font-size="17" font-family="Arial, sans-serif" font-weight="800">Zz</text>`,
    heart: `<path d="M68 25c4-5 12-1 10 6-1 5-5 8-10 12-5-4-9-7-10-12-2-7 6-11 10-6Z" fill="${tone}"/>`,
    angry: `<path d="M68 22 58 42h9l-4 15 16-24h-9l6-11h-8Z" fill="${tone}"/>`,
  };
  return symbols[symbol] || "";
}

function svgToDataUri(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}
