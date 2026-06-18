const AVATAR_DEFINITIONS = [
  ["jeju-girl-rose", "\u73ab\u7470\u5973\u5b69", "girl", "jeju-avatar-01.png"],
  ["jeju-girl-mint", "\u8584\u8377\u5973\u5b69", "girl", "jeju-avatar-02.png"],
  ["jeju-girl-coral", "\u73ca\u745a\u5973\u5b69", "girl", "jeju-avatar-03.png"],
  ["jeju-girl-lavender", "\u7d2b\u85e4\u5973\u5b69", "girl", "jeju-avatar-04.png"],
  ["jeju-cat-cream", "\u6a58\u5b50\u5c0f\u8c93", "cat", "jeju-avatar-05.png"],
  ["jeju-cat-mint", "\u7070\u7070\u5c0f\u8c93", "cat", "jeju-avatar-06.png"],
  ["jeju-cat-peach", "\u96ea\u767d\u5c0f\u8c93", "cat", "jeju-avatar-07.png"],
  ["jeju-dog-cream", "\u68c9\u82b1\u5c0f\u72d7", "dog", "jeju-avatar-08.png"],
  ["jeju-dog-cocoa", "\u7126\u7cd6\u5c0f\u72d7", "dog", "jeju-avatar-09.png"],
  ["jeju-dog-lavender", "\u67f4\u67f4\u5c0f\u72d7", "dog", "jeju-avatar-10.png"],
];

export const AVATAR_PRESETS = AVATAR_DEFINITIONS.map(([id, label, kind, fileName]) => ({
  id,
  label,
  kind,
  url: new URL(`../assets/avatars/${fileName}`, import.meta.url).href,
}));

export function getAvatarPreset(id) {
  return AVATAR_PRESETS.find((avatar) => avatar.id === id) || AVATAR_PRESETS[0];
}

export function getDefaultAvatarForIndex(index) {
  return AVATAR_PRESETS[Math.abs(Number(index || 0)) % AVATAR_PRESETS.length];
}

export function isCustomAvatarUrl(url) {
  const value = String(url || "");
  return Boolean(value) && !value.startsWith("data:image/svg+xml");
}

export function resolveAvatarUrl(avatarPresetId, avatarUrl) {
  const presetUrl = getAvatarPreset(avatarPresetId).url;
  return isCustomAvatarUrl(avatarUrl) ? avatarUrl : presetUrl;
}
