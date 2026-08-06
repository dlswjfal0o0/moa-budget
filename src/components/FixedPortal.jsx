import { createPortal } from 'react-dom'

// position:fixed 요소는 zoom(글자 크기 배율)이 적용된 조상 안에 있으면
// WebKit에서 뷰포트가 아닌 그 조상 기준으로 고정돼 버린다.
// document.body로 포탈해 zoom 서브트리 밖으로 빼내 이 문제를 피한다.
export default function FixedPortal({ children }) {
  return createPortal(children, document.body)
}
