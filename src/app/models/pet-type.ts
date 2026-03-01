/**
 * Pet type interface and constants
 */

export interface IPetType {
  value: string;   // matches IBreed.kind — 'dog' | 'cat' | 'cow' | 'horse'
  label: string;
  icon: string;    // emoji icon displayed in the tile
}

/**
 * Available pet types with their display labels and icons
 */
export const PET_TYPES: IPetType[] = [
  { value: 'dog',   label: 'Dog',   icon: '🐕' },
  { value: 'cat',   label: 'Cat',   icon: '🐈' },
  { value: 'cow',   label: 'Cow',   icon: '🐄' },
  { value: 'horse', label: 'Horse', icon: '🐴' },
];

/**
 * Get pet type by value
 */
export function getPetTypeByValue(value: string): IPetType | undefined {
  return PET_TYPES.find(pt => pt.value === value);
}

/**
 * Get pet type label by value
 */
export function getPetTypeLabel(value: string): string {
  return getPetTypeByValue(value)?.label || value;
}

/**
 * Get pet type icon by value
 */
export function getPetTypeIcon(value: string): string {
  return getPetTypeByValue(value)?.icon || '🐾';
}
