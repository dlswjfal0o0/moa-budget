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

// primary 색상 자체를 배경으로 쓰는 "컬러 하이라이트" 요소(배너, 헤더, 아이콘 배지)용
// 그림자 색. primary보다 어둡게/밝게 튼 같은 색상 계열 그림자를 만들어, solid 컬러를
// 유지하면서도 뉴모피즘 특유의 양각(raised)/음각(inset) 느낌을 낼 수 있게 한다.
export function getColoredShadow(primaryHex) {
  let dark = 'rgba(0,0,0,0.35)'
  let light = 'rgba(255,255,255,0.4)'
  if (primaryHex && typeof primaryHex === 'string' && primaryHex.startsWith('#')) {
    const [h, s, l] = hexToHsl(primaryHex)
    dark = `hsla(${h.toFixed(1)}, ${s.toFixed(0)}%, ${Math.max(l - 20, 5).toFixed(0)}%, 0.45)`
    light = `hsla(${h.toFixed(1)}, ${Math.max(s - 15, 0).toFixed(0)}%, ${Math.min(l + 20, 96).toFixed(0)}%, 0.55)`
  }
  return {
    dark, light,
    raised: `6px 6px 14px ${dark}, -6px -6px 14px ${light}`,
    raisedSm: `3px 3px 7px ${dark}, -3px -3px 7px ${light}`,
    inset: `inset 4px 4px 9px ${dark}, inset -4px -4px 9px ${light}`,
    // 화면 가장자리까지 꽉 차는 배너용 — 위/좌우는 화면 밖이라 안 보이므로 아래쪽으로만
    // 은은하게 떨어지는 컬러 그림자로 "떠 있는" 느낌을 낸다.
    drop: `0 12px 24px -8px ${dark}`,
  }
}
