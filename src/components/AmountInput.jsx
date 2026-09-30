import { useLayoutEffect, useRef } from 'react'

// 숫자만 남긴 원본 문자열 (allowNegative면 선두 '-' 허용)
const toRaw = (str, allowNegative) => {
  const s = String(str ?? '')
  const neg = allowNegative && s.trim().startsWith('-')
  const digits = s.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return neg ? `-${digits}` : digits
}

const toDisplay = (raw) => {
  const s = String(raw ?? '')
  const neg = s.startsWith('-')
  const digits = s.replace(/\D/g, '')
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return neg ? `-${grouped}` : grouped
}

// 금액 입력칸: 화면엔 1,000 단위 콤마를 보여주고, onChange로는 콤마 없는 숫자 문자열을 넘긴다.
export default function AmountInput({ value, onChange, allowNegative = false, ...rest }) {
  const ref = useRef(null)
  const caretDigits = useRef(null)
  const display = toDisplay(value)

  // 콤마가 끼어들어도 커서가 같은 숫자 뒤에 머물도록 복원
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || caretDigits.current == null || document.activeElement !== el) return
    let count = caretDigits.current
    let pos = 0
    while (pos < display.length && count > 0) {
      if (/[\d-]/.test(display[pos])) count--
      pos++
    }
    el.setSelectionRange(pos, pos)
    caretDigits.current = null
  }, [display])

  const handleChange = (e) => {
    let { value: next, selectionStart: caret } = e.target
    caret = caret ?? next.length
    // 콤마만 지워진 경우(백스페이스) 그 앞 숫자를 대신 지운다
    if (next.length === display.length - 1 && toRaw(next, allowNegative) === toRaw(display, allowNegative) && caret > 0) {
      next = next.slice(0, caret - 1) + next.slice(caret)
      caret -= 1
    }
    caretDigits.current = (next.slice(0, caret).match(/[\d-]/g) || []).length
    onChange(toRaw(next, allowNegative))
  }

  return (
    <input {...rest} ref={ref} type="text" inputMode={allowNegative ? 'text' : 'numeric'}
      value={display} onChange={handleChange} />
  )
}
