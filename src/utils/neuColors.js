// 선택된 테마 색상(primary)을 기반으로 뉴모피즘 배경/그림자 색을 계산한다.
// 뉴모피즘은 배경과 그림자가 같은 색상 계열이어야 자연스러워 보이므로,
// primary의 색상(hue)만 가져와 매우 옅은 배경과 중간 톤 그림자를 만든다.
function hexToHsl(hex) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

export function getNeuPalette(primaryHex) {
  if (!primaryHex || typeof primaryHex !== 'string' || !primaryHex.startsWith('#')) {
    return { bg: '#EAEEF3', dark: 'rgba(163,177,198,0.55)', light: 'rgba(255,255,255,0.9)' }
  }
  const [h] = hexToHsl(primaryHex)
  return {
    bg: `hsl(${h.toFixed(1)}, 25%, 93%)`,
    dark: `hsla(${h.toFixed(1)}, 26%, 70%, 0.55)`,
    light: 'rgba(255,255,255,0.9)',
  }
}
