import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const PRIMARY = '#3182F6'
const BG = '#fefaf4'
const TEXT = '#1A0E05'
const TEXT2 = '#8B6F5E'

function HomeMockup() {
  return (
    <div style={{ flex: 1, background: '#f8f8f8', overflow: 'hidden' }}>
      <div style={{ background: PRIMARY, padding: '10px 12px', color: 'white' }}>
        <div style={{ fontSize: 8, opacity: 0.8, marginBottom: 2 }}>6월 가계부</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>1,250,000원</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div><div style={{ fontSize: 7, opacity: 0.7 }}>수입</div><div style={{ fontSize: 9, fontWeight: 600 }}>+2,000,000원</div></div>
          <div><div style={{ fontSize: 7, opacity: 0.7 }}>지출</div><div style={{ fontSize: 9, fontWeight: 600 }}>-750,000원</div></div>
        </div>
      </div>
      <div style={{ background: 'white', margin: '5px 5px 0', borderRadius: 8, padding: '6px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 8, fontWeight: 600, color: '#111' }}>월 예산</span>
          <span style={{ fontSize: 7, color: PRIMARY }}>75% 사용</span>
        </div>
        <div style={{ height: 5, background: '#f0f0f0', borderRadius: 99, marginBottom: 3 }}>
          <div style={{ height: '100%', width: '75%', background: PRIMARY, borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 7, color: '#22c55e' }}>250,000원 남음</div>
      </div>
      <div style={{ background: 'white', margin: '4px 5px 0', borderRadius: 8, padding: '6px 8px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#111', marginBottom: 5 }}>카테고리별 지출</div>
        {[['식비', '#FF6B6B', '65%'], ['교통', '#4ECDC4', '15%'], ['쇼핑', '#45B7D1', '20%']].map(([n, c, w]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 7, color: 'white', fontWeight: 700 }}>{n[0]}</span>
            </div>
            <div style={{ flex: 1, height: 4, background: '#f0f0f0', borderRadius: 99 }}>
              <div style={{ height: '100%', width: w, background: c, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 7, color: '#888', minWidth: 22 }}>{w}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarMockup() {
  const days = ['일','월','화','수','목','금','토']
  const weeks = [[1,2,3,4,5,6,7],[8,9,10,11,12,13,14],[15,16,17,18,19,20,21]]
  const expDays = [3,7,12,15,20], incDays = [10,17]
  return (
    <div style={{ flex: 1, background: 'white', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontSize: 8, color: '#888' }}>‹</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#111' }}>2026년 6월</span>
        <span style={{ fontSize: 8, color: '#888' }}>›</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '4px 8px 0' }}>
        {days.map((d, i) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 7, color: i===0 ? '#ef4444' : i===6 ? PRIMARY : '#888', padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ padding: '2px 8px' }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 3 }}>
            {week.map(day => (
              <div key={day} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: day === 2 ? PRIMARY : '#111', fontWeight: day === 2 ? 700 : 400 }}>{day}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  {expDays.includes(day) && <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#ef4444' }} />}
                  {incDays.includes(day) && <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#22c55e' }} />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, padding: '5px 8px', borderTop: '1px solid #f5f5f5' }}>
        <div style={{ flex: 1, background: '#FFF5F5', borderRadius: 6, padding: '5px 7px' }}>
          <div style={{ fontSize: 7, color: '#888' }}>이번 주 지출</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#ef4444' }}>-125,000원</div>
        </div>
        <div style={{ flex: 1, background: '#F0FFF4', borderRadius: 6, padding: '5px 7px' }}>
          <div style={{ fontSize: 7, color: '#888' }}>수입</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#22c55e' }}>+500,000원</div>
        </div>
      </div>
      <div style={{ padding: '5px 8px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#111', marginBottom: 4 }}>고정지출</div>
        {[['월세', '500,000원', true], ['넷플릭스', '17,000원', false]].map(([name, amt, done]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: done ? PRIMARY : '#f0f0f0', border: done ? 'none' : '1px solid #ddd', flexShrink: 0 }} />
            <span style={{ fontSize: 7, color: done ? '#bbb' : '#111', textDecoration: done ? 'line-through' : 'none', flex: 1 }}>{name}</span>
            <span style={{ fontSize: 7, color: done ? '#bbb' : '#ef4444' }}>{amt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LedgerMockup() {
  return (
    <div style={{ flex: 1, background: '#f8f8f8', overflow: 'hidden' }}>
      <div style={{ background: 'white', padding: '6px 10px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
          {['주간','월간','직접'].map((t, i) => (
            <div key={t} style={{ padding: '2px 8px', borderRadius: 20, background: i===1 ? PRIMARY : '#f0f0f0', fontSize: 7, color: i===1 ? 'white' : '#666' }}>{t}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {['전체','소비','수입'].map((t, i) => (
            <div key={t} style={{ padding: '2px 8px', borderRadius: 20, background: i===0 ? '#111' : '#f0f0f0', fontSize: 7, color: i===0 ? 'white' : '#666' }}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: '4px 7px' }}>
        {[
          { date: '06/02', items: [{ title: '스타벅스', cat: '식비', color: '#FF6B6B', amount: '-6,500', type: 'e' }, { title: '버스', cat: '교통', color: '#4ECDC4', amount: '-1,400', type: 'e' }] },
          { date: '06/01', items: [{ title: '급여', cat: '급여', color: '#4ADE80', amount: '+2,000,000', type: 'i' }] }
        ].map(({ date, items }) => (
          <div key={date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '4px 0 3px' }}>
              <span style={{ fontSize: 7, color: '#aaa', whiteSpace: 'nowrap', fontWeight: 600 }}>{date}</span>
              <div style={{ flex: 1, height: 0.5, background: '#e0e0e0' }} />
              <span style={{ fontSize: 7, color: '#bbb', whiteSpace: 'nowrap' }}>-7,900원</span>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 8, padding: '5px 7px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: item.color }}>{item.cat[0]}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, fontWeight: 500, color: '#111' }}>{item.title}</div>
                  <div style={{ fontSize: 6, color: '#bbb' }}>{item.cat}</div>
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, color: item.type === 'e' ? '#ef4444' : '#22c55e' }}>{item.amount}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisMockup() {
  const bars = [45,20,80,30,65,45,90,35,50,20,40,15]
  return (
    <div style={{ flex: 1, background: '#f8f8f8', overflow: 'hidden', padding: '5px 6px' }}>
      <div style={{ background: 'white', borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#111', marginBottom: 4 }}>지난 달 대비</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ flex: 1, background: '#FFF5F5', borderRadius: 5, padding: '4px 6px' }}>
            <div style={{ fontSize: 6, color: '#888' }}>지출</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#ef4444' }}>750,000원</div>
            <div style={{ fontSize: 6, color: '#ef4444' }}>▲ 5.2% 증가</div>
          </div>
          <div style={{ flex: 1, background: '#F0FFF4', borderRadius: 5, padding: '4px 6px' }}>
            <div style={{ fontSize: 6, color: '#888' }}>수입</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#22c55e' }}>2,000,000원</div>
            <div style={{ fontSize: 6, color: '#aaa' }}>– 변동 없음</div>
          </div>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#111', marginBottom: 4 }}>일별 지출</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: PRIMARY, borderRadius: '2px 2px 0 0', opacity: 0.75 }} />
          ))}
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: 8, padding: '6px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 8, fontWeight: 600, color: '#111' }}>AI 소비 분석</span>
          <div style={{ background: PRIMARY, borderRadius: 10, padding: '2px 7px', fontSize: 6, color: 'white' }}>AI 분석</div>
        </div>
        <div style={{ background: '#F0FFF4', borderRadius: 6, padding: '5px 7px', borderLeft: `2px solid #22c55e` }}>
          <div style={{ fontSize: 7, color: '#22c55e', fontWeight: 600, marginBottom: 2 }}>🌟 소비 점수 78점</div>
          <div style={{ fontSize: 6, color: '#555', lineHeight: 1.4 }}>식비 지출이 전월 대비 15% 증가했어요. 주 2회 외식으로 줄여보세요.</div>
        </div>
      </div>
    </div>
  )
}

function MyMockup() {
  return (
    <div style={{ flex: 1, background: '#f8f8f8', overflow: 'hidden' }}>
      <div style={{ background: PRIMARY, padding: '10px 12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>yein</div>
            <div style={{ fontSize: 7, opacity: 0.7 }}>yein@gmail.com</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 7, padding: '4px 5px', fontSize: 10 }}>⚙️</div>
      </div>
      <div style={{ background: 'white', margin: '5px 5px 0', borderRadius: 8, padding: '6px 8px' }}>
        <div style={{ fontSize: 7, color: '#888' }}>총 자산</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>3,750,000원</div>
      </div>
      <div style={{ background: 'white', margin: '4px 5px 0', borderRadius: 8, padding: '6px 8px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#111', marginBottom: 5 }}>카드 실적</div>
        {[['신한카드', 75, false], ['현대카드', 92, true]].map(([name, pct, done]) => (
          <div key={name} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 7, color: '#111' }}>{name}</span>
              {done && <span style={{ fontSize: 6, background: '#dcfce7', color: '#16a34a', borderRadius: 10, padding: '1px 5px' }}>달성 ✓</span>}
            </div>
            <div style={{ height: 4, background: '#f0f0f0', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: done ? '#22c55e' : PRIMARY, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', margin: '4px 5px 0', borderRadius: 8, padding: '6px 8px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#111', marginBottom: 4 }}>계좌</div>
        {[['카카오뱅크', '1,250,000원'], ['토스뱅크', '380,000원']].map(([bank, bal]) => (
          <div key={bank} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f8f8f8' }}>
            <span style={{ fontSize: 7, color: '#333' }}>{bank}</span>
            <span style={{ fontSize: 7, fontWeight: 600, color: '#111' }}>{bal}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SLIDES = [
  {
    id: 'home', tab: '홈',
    title: '홈 대시보드',
    desc: '이번 달 소비 현황을 한눈에',
    features: [
      '이번 달 잔액 · 수입 · 지출 요약',
      '카테고리별 지출 비율 & 바 차트',
      '기간별 예산 설정 + AI 조언',
      '최근 내역 빠른 확인',
    ],
    Mockup: HomeMockup,
  },
  {
    id: 'calendar', tab: '달력',
    title: '달력',
    desc: '날짜별 소비 패턴을 파악해요',
    features: [
      '날짜별 수입 · 지출 금액 표시',
      '주간 · 월간 합계 한눈에',
      '고정지출 납부 여부 체크박스',
      '날짜 클릭 시 상세 내역 확인',
    ],
    Mockup: CalendarMockup,
  },
  {
    id: 'ledger', tab: '가계부',
    title: '가계부',
    desc: '내역 관리의 모든 것',
    features: [
      '주간 · 월간 · 직접 기간 정렬',
      '날짜별 구분선 & 일별 합계',
      '카드 · 계좌 · 현금 결제수단 분류',
      '⚙️ 설정: 카테고리 관리 · 이월 설정',
    ],
    Mockup: LedgerMockup,
  },
  {
    id: 'analysis', tab: '분석',
    title: '분석',
    desc: 'AI가 소비 패턴을 분석해요',
    features: [
      '지난 달 대비 수입 · 지출 비교',
      '일별 지출 바차트',
      'AI 소비 점수 & 절감 팁 제안',
      '이상 지출 감지 & 절감 목표',
    ],
    Mockup: AnalysisMockup,
  },
  {
    id: 'my', tab: 'MY',
    title: 'MY',
    desc: '나의 자산과 앱 설정',
    features: [
      '카드 실적 달성률 · 혜택 · 내역 확인',
      '계좌 · 현금 잔액 관리 & 총 자산',
      '테마 변경 (6가지 스타일)',
      '⚙️ 설정: PDF · 엑셀 내보내기',
    ],
    Mockup: MyMockup,
  },
]

export default function HowToUse() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(null)

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50 && current < SLIDES.length - 1) setCurrent(c => c + 1)
    if (dx > 50 && current > 0) setCurrent(c => c - 1)
  }

  const slide = SLIDES[current]
  const Mockup = slide.Mockup
  const isLast = current === SLIDES.length - 1

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>

      {/* 탭 인디케이터 */}
      <div style={{ padding: '48px 16px 12px', display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)}
            style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, transition: 'all 0.2s',
              background: i === current ? PRIMARY : `${PRIMARY}15`,
              color: i === current ? 'white' : PRIMARY,
              fontWeight: i === current ? 700 : 400 }}>
            {s.tab}
          </button>
        ))}
      </div>

      {/* 폰 목업 */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ width: 190, height: 340, background: 'white', borderRadius: 26, border: `2px solid ${PRIMARY}20`, overflow: 'hidden', boxShadow: `0 16px 48px ${PRIMARY}22`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 22, background: PRIMARY, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', flexShrink: 0 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>9:41</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>●●●</span>
          </div>
          <Mockup />
        </div>
      </div>

      {/* 기능 설명 */}
      <div style={{ flex: 1, padding: '16px 28px 0', overflow: 'hidden' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 3, letterSpacing: -0.5 }}>{slide.title}</h2>
        <p style={{ fontSize: 14, color: TEXT2, marginBottom: 12 }}>{slide.desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slide.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, flexShrink: 0, marginTop: 5 }} />
              <p style={{ fontSize: 13, color: '#2D1C0D', lineHeight: 1.4, margin: 0 }}>{f}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div style={{ padding: '12px 24px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{ width: i === current ? 22 : 6, height: 6, borderRadius: 3, background: i === current ? PRIMARY : `${PRIMARY}25`, transition: 'width 0.3s', cursor: 'pointer' }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isLast && (
            <button onClick={() => navigate('/auth')}
              style={{ padding: '11px 16px', borderRadius: 30, background: 'transparent', color: TEXT2, border: 'none', fontSize: 13, cursor: 'pointer' }}>
              건너뛰기
            </button>
          )}
          <button onClick={() => isLast ? navigate('/auth') : setCurrent(c => c + 1)}
            style={{ padding: '12px 24px', borderRadius: 30, background: PRIMARY, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {isLast ? '시작하기 →' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}