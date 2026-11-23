/**
 * Pet type interface and constants
 */

export interface IPetType {
  value: string;   // matches IBreed.kind — 'dog' | 'cat'
  label: string;
  iconClass: string;  // CSS classes for the pet icon (see .pet-icon in styles.css)
}

/**
 * Available pet types with their display labels and icons.
 * Cow and Horse are hidden — dogs and cats only for now.
 */
export const PET_TYPES: IPetType[] = [
  { value: 'dog', label: 'Dog', iconClass: 'pet-icon pet-icon--dog' },
  { value: 'cat', label: 'Cat', iconClass: 'pet-icon pet-icon--cat' },
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

/** Icon used when the pet type is unknown. */
export const PAW_ICON_CLASS = 'pet-icon pet-icon--paw';

/**
 * CSS classes for a pet type's icon, falling back to a paw.
 */
export function getPetTypeIconClass(value: string | null | undefined): string {
  return (value && getPetTypeByValue(value)?.iconClass) || PAW_ICON_CLASS;
}
