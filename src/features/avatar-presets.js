const AVATAR_DEFINITIONS = [
  ["jeju-girl-rose", "玫瑰女孩", "girl", "#ffe6ef", "#7d3b66", "#ff88ad"],
  ["jeju-girl-mint", "薄荷女孩", "girl", "#e1f8ef", "#176b5f", "#71d3b4"],
  ["jeju-girl-lavender", "紫藤女孩", "girl", "#eee6ff", "#674b93", "#b39cf0"],
  ["jeju-girl-coral", "珊瑚女孩", "girl", "#ffe9df", "#8b4432", "#ff9b7a"],
  ["jeju-cat-cream", "奶油小貓", "cat", "#fff3d7", "#7c5a36", "#f2c178"],
  ["jeju-cat-peach", "水蜜桃小貓", "cat", "#ffe2dc", "#8a4c54", "#ff9aa7"],
  ["jeju-cat-mint", "薄荷小貓", "cat", "#ddf7f2", "#356d73", "#77d5c8"],
  ["jeju-dog-cream", "奶油小狗", "dog", "#fff1cf", "#80613d", "#f0bd75"],
  ["jeju-dog-cocoa", "可可小狗", "dog", "#f3dcc9", "#674026", "#b87a4c"],
  ["jeju-dog-lavender", "紫奶小狗", "dog", "#eee8ff", "#5f5576", "#b3a2ea"],
];

export const AVATAR_PRESETS = AVATAR_DEFINITIONS.map(([id, label, kind, bg, ink, accent]) => ({
  id,
  label,
  kind,
  url: svgDataUrl(renderAvatarSvg(kind, bg, ink, accent)),
}));

export function getAvatarPreset(id) {
  return AVATAR_PRESETS.find((avatar) => avatar.id === id) || AVATAR_PRESETS[0];
}

export function getDefaultAvatarForIndex(index) {
  return AVATAR_PRESETS[Math.abs(Number(index || 0)) % AVATAR_PRESETS.length];
}

function svgDataUrl(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function renderAvatarSvg(kind, bg, ink, accent) {
  const ears = kind === "cat"
    ? `<path d="M74 62 88 38l12 31" fill="${accent}"/><path d="M150 62l-14-24-12 31" fill="${accent}"/>`
    : kind === "dog"
      ? `<ellipse cx="70" cy="84" rx="20" ry="32" fill="${accent}"/><ellipse cx="154" cy="84" rx="20" ry="32" fill="${accent}"/>`
      : `<path d="M66 82c5-28 26-44 46-44s41 16 46 44v24H66V82Z" fill="${accent}"/>`;
  const faceShape = kind === "girl" ? "circle" : "ellipse";
  const face = faceShape === "circle"
    ? `<circle cx="112" cy="104" r="55" fill="#fff7ef"/>`
    : `<ellipse cx="112" cy="108" rx="54" ry="49" fill="#fffaf3"/>`;
  const nose = kind === "girl"
    ? `<path d="M108 112c4 3 8 3 12 0" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`
    : `<path d="M106 112h12l-6 7Z" fill="${ink}"/><path d="M112 119v8" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 224">
      <rect width="224" height="224" rx="112" fill="${bg}"/>
      ${ears}
      ${face}
      <circle cx="92" cy="99" r="7" fill="${ink}"/>
      <circle cx="132" cy="99" r="7" fill="${ink}"/>
      ${nose}
      <path d="M91 135c13 10 29 10 42 0" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="78" cy="120" r="9" fill="${accent}" opacity=".32"/>
      <circle cx="146" cy="120" r="9" fill="${accent}" opacity=".32"/>
    </svg>
  `.trim();
}
