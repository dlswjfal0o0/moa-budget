import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../contexts/SettingsContext'
import SToggle from '../../components/SToggle'
import AIStyleSlider from '../../components/AIStyleSlider'

const PRIMARY = '#3182F6'

export default function AIStyleSetup() {
  const navigate = useNavigate()
  const { setAiAnalysisStyle, setAiShowAdvice } = useSettings()
  const [style, setStyle] = useState(3)
  const [advice, setAdvice] = useState(true)

  const handleComplete = () => {
    setAiAnalysisStyle(style)
    setAiShowAdvice(advice)
    navigate('/home', { replace: true })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 'calc(env(safe-area-inset-top, 0px) + 32px) 28px 32px', background: '#fff' }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6 }}>AI 분석 스타일을 선택해주세요</h2>
        <p style={{ fontSize: 14, color: '#999', marginBottom: 36 }}>
          나에게 맞는 분석 말투와 조언 방식을 골라보세요
        </p>

        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>① 분석 스타일</p>
          <div style={{ background: '#fafafa', borderRadius: 16, padding: '18px 16px', border: '1.5px solid #f0f0f0' }}>
            <AIStyleSlider value={style} onChange={setStyle} primary={PRIMARY} />
          </div>
        </div>

        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>② 조언</p>
          <div style={{ background: '#fafafa', borderRadius: 16, padding: '16px', border: '1.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>조언 받기</p>
              <p style={{ fontSize: 12, color: '#999', marginTop: 2 }}>분석 결과와 함께 실천 방법을 제안해요</p>
            </div>
            <SToggle on={advice} onChange={setAdvice} primary={PRIMARY} />
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#bbb', marginBottom: 16 }}>
        추후 [설정 &gt; AI 분석]에서 언제든 변경할 수 있습니다.
      </p>
      <button
        onClick={handleComplete}
        style={{
          width: '100%', padding: '15px', borderRadius: 14,
          background: PRIMARY, color: '#fff',
          border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer'
        }}>
        완료
      </button>
    </div>
  )
}
