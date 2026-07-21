import { useDeepLinks } from '../hooks/useDeepLinks'

// react-router의 Router 컨텍스트 안에서 마운트되어야 하므로 BrowserRouter 내부에 둔다.
export default function DeepLinkListener() {
  useDeepLinks()
  return null
}
