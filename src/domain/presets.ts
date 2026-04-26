/**
 * Curated yarn color palette — each preset has a Polish name + hex.
 * The picker renders these as a clickable swatch grid; a click
 * commits both name and hex to the chosen color slot.
 */
export interface ColorPreset {
  name: string;
  hex: string;
}

export const COLOR_PRESETS: readonly ColorPreset[] = [
  // Whites / creams
  { name: 'Kremowy',      hex: '#F5EDE0' },
  { name: 'Biały',        hex: '#FFFFFF' },
  { name: 'Beżowy',       hex: '#E0D4B8' },
  { name: 'Piaskowy',     hex: '#D4C4A0' },

  // Pinks / reds
  { name: 'Pudrowy róż',  hex: '#E8B4B8' },
  { name: 'Łosoś',        hex: '#F4A8A0' },
  { name: 'Bordo',        hex: '#C97B84' },
  { name: 'Wino',         hex: '#A8453F' },
  { name: 'Czerwony',     hex: '#D63B3B' },
  { name: 'Malina',       hex: '#B83A5C' },

  // Oranges / yellows
  { name: 'Pomarańczowy', hex: '#E89A4D' },
  { name: 'Musztardowy',  hex: '#C9A961' },
  { name: 'Złoty',        hex: '#D4A85A' },
  { name: 'Słoneczny',    hex: '#F4D165' },

  // Greens
  { name: 'Szałwia',      hex: '#A8B89C' },
  { name: 'Mech',         hex: '#7A8E70' },
  { name: 'Jadeit',       hex: '#5C8E7C' },
  { name: 'Trawa',        hex: '#6BA85A' },

  // Blues / purples
  { name: 'Niebieski',    hex: '#5C7A95' },
  { name: 'Granatowy',    hex: '#2C3E5A' },
  { name: 'Lawenda',      hex: '#B8A8D4' },
  { name: 'Fiolet',       hex: '#9B7BC9' },
  { name: 'Śliwka',       hex: '#6B4A6E' },

  // Browns / neutrals
  { name: 'Brąz',         hex: '#8A6D52' },
  { name: 'Czekolada',    hex: '#5C3F2F' },
  { name: 'Szary',        hex: '#A0A0A0' },
  { name: 'Grafit',       hex: '#4A4A4A' },
  { name: 'Czarny',       hex: '#2A2A2A' },
];
