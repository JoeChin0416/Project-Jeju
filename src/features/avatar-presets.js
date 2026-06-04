const AVATAR_DEFINITIONS = [
  ["girl-pink", "粉色女孩", "girl", "#ffe1ec", "#8b3a62", "#ff8fb3"],
  ["girl-mint", "薄荷女孩", "girl", "#dff8ef", "#166b5d", "#79d7b8"],
  ["girl-blue", "藍色女孩", "girl", "#dfeeff", "#2f5597", "#78aaf2"],
  ["girl-lavender", "薰衣草女孩", "girl", "#efe6ff", "#6a4c93", "#b9a0ef"],
  ["dog-cream", "奶油狗狗", "dog", "#fff1cf", "#8d6a3f", "#f1c27a"],
  ["dog-brown", "可可狗狗", "dog", "#f4dcc8", "#714423", "#b6794c"],
  ["dog-black", "黑糖狗狗", "dog", "#e9e5df", "#2d2926", "#81766c"],
  ["cat-orange", "橘貓", "cat", "#ffe5c6", "#914d1c", "#f29d4b"],
  ["cat-gray", "灰貓", "cat", "#e7edf2", "#52616b", "#a3b1bc"],
  ["cat-white", "白貓", "cat", "#f7f4ed", "#5f6470", "#f5c6cf"],
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
