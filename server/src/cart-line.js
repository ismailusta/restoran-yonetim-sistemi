export function buildLineKey(menuItemId, modifiers = []) {
  const ids = [...modifiers]
    .map((m) => m.id)
    .sort((a, b) => a - b)
    .join(',');
  return `${menuItemId}:${ids}`;
}

export function itemLineKey(item) {
  if (item.lineKey) return item.lineKey;
  const mods = item.selectedModifiers ?? item.modifiers ?? [];
  return buildLineKey(item.id, mods);
}
