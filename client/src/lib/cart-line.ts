export interface ModifierSelection {
  id: number;
  label: string;
  priceDelta: number;
}

export function buildLineKey(menuItemId: number, modifiers: ModifierSelection[] = []) {
  const ids = modifiers
    .map((m) => m.id)
    .sort((a, b) => a - b)
    .join(',');
  return `${menuItemId}:${ids}`;
}

export function calcUnitPrice(basePrice: number, modifiers: ModifierSelection[] = []) {
  return basePrice + modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
}

export function modifierLabels(modifiers: ModifierSelection[] = []) {
  return modifiers.map((m) => m.label);
}
