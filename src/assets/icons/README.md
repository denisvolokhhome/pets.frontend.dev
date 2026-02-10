# Custom Marker Icons

This folder contains custom marker icons for the Pet Search with Map feature.

## Usage

Place custom marker icon files (SVG or PNG) in this folder. The map component will reference these icons for displaying breeding locations on the map.

## Recommended Format

- **Format**: SVG (preferred) or PNG
- **Size**: 32x32 pixels for standard markers
- **Naming**: Use descriptive names like `paw-marker.svg`, `breeder-marker.svg`

## Example

```typescript
const pawIcon = icon({
  iconUrl: 'assets/icons/paw-marker.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});
```
