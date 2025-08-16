export function hexToRgb(hex) {
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const intVal = parseInt(normalized, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return { r, g, b };
}

export function hexToRgba(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
} 