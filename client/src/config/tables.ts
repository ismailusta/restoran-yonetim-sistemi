export interface AreaConfig {
  id: string;
  label: string;
  tableCount: number;
}

export function tableKey(area: string, tableNumber: number) {
  return `${area}:${tableNumber}`;
}

export function areaLabel(areas: AreaConfig[], areaId: string) {
  return areas.find((a) => a.id === areaId)?.label ?? areaId;
}
