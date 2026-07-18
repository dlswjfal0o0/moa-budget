import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const PRIMARY = '#3182F6'
const BG = '#fff'
const TEXT = '#191F28'
const TEXT2 = '#8B95A1'
const DANGER = '#FF5A5F'
const SUCCESS = '#2ECC71'
const BG_PAGE = '#F7F8FA'
const BG_CARD = '#FFFFFF'
const BORDER = '#F2F4F6'

function useCountUp(target, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const d = setTimeout(() => {
      const steps = 40, inc = target / steps, step = duration / steps
      let cur = 0
      const t = setInterval(() => {
        cur += inc
        if (cur >= target) { setValue(target); clearInterval(t) }
        else setValue(Math.floor(cur))
      }, step)
      return () => clearInterval(t)
    }, delay)
    return () => clearTimeout(d)
  }, [])
  return value
}

/* ───────── 하단 네비 목업 ───────── */
function BottomNavMockup({ active }) {
  const tabs = [
    { label: '캘린더', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { label: '가계부', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    { label: '홈', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { label: '분석', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { label: 'MY', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]
  return (
    <div style={{ display:'flex', background:'#fff', borderTop:`1px solid ${BORDER}`, flexShrink:0 }}>
      {tabs.map(tab => {
        const isActive = tab.label === active
        const color = isActive ? PRIMARY : '#C9CDD4'
        return (
          <div key={tab.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 0 5px', gap:2, color }}>
            {tab.icon}
            <span style={{ fontSize:5.5, fontWeight: isActive ? 700 : 400, color }}>{tab.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ───────── 홈 목업 ───────── */
function HomeMockup() {
  const [gaugeOn, setGaugeOn] = useState(false)
  const [barsOn, setBarsOn] = useState(false)
  const pct = useCountUp(75, 1000, 300)
  useEffect(() => {
    const t1 = setTimeout(() => setGaugeOn(true), 200)
    const t2 = setTimeout(() => setBarsOn(true), 600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const categories = [['식비','#FF6B6B',65],['교통','#4ECDC4',15],['쇼핑','#45B7D1',20]]

  return (
    <div style={{ flex:1, background:BG_PAGE, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 헤더 — 실제와 동일한 Toss 스타일 */}
      <div style={{ background:PRIMARY, padding:'10px 14px 14px', color:'white', flexShrink:0 }}>
        <p style={{ fontSize:6.5, opacity:0.75, marginBottom:2, fontWeight:500 }}>2026년 6월</p>
        <p style={{ fontSize:9, fontWeight:600, marginBottom:10, opacity:0.95 }}>이번 달 현황</p>
        {/* 잔액 카드 — 실제: rgba(0,0,0,0.14) 배경 */}
        <div style={{ background:'rgba(0,0,0,0.14)', borderRadius:12, padding:'10px 12px' }}>
          <p style={{ fontSize:6.5, opacity:0.75, marginBottom:4, fontWeight:500 }}>이번 달 잔액</p>
          <p style={{ fontSize:18, fontWeight:700, marginBottom:8, letterSpacing:'-0.5px', lineHeight:1.1 }}>1,250,000원</p>
          <div style={{ display:'flex', gap:0 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:6, opacity:0.65, marginBottom:2, fontWeight:500 }}>수입</p>
              <p style={{ fontSize:8.5, fontWeight:700 }}>+2,000,000원</p>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.2)', margin:'0 10px' }}/>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:6, opacity:0.65, marginBottom:2, fontWeight:500 }}>지출</p>
              <p style={{ fontSize:8.5, fontWeight:700 }}>-750,000원</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflow:'hidden', padding:'8px 8px 0' }}>
        {/* 예산 관리 — 실제: 카드 스타일, 반원 그래프 + 잔여 금액 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'8px 10px', marginBottom:6, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <p style={{ fontSize:8, fontWeight:700, color:TEXT }}>예산 관리</p>
            <div style={{ background:PRIMARY, borderRadius:6, padding:'2px 6px', fontSize:5.5, color:'white', fontWeight:600 }}>+ 추가</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* 반원 그래프 */}
            <div style={{ position:'relative', width:60, height:34, flexShrink:0 }}>
              <svg width="60" height="34" viewBox="0 0 88 48">
                <path d="M 8 44 A 36 36 0 0 1 80 44" fill="none" stroke="#F2F4F6" strokeWidth="9" strokeLinecap="round"/>
                <path d="M 8 44 A 36 36 0 0 1 80 44" fill="none" stroke={PRIMARY} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={Math.PI*36} strokeDashoffset={gaugeOn ? Math.PI*36*(1-75/100) : Math.PI*36}
                  style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}/>
              </svg>
              <p style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', fontSize:8, fontWeight:700, color:PRIMARY, whiteSpace:'nowrap' }}>{pct}%</p>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:5.5, color:TEXT2, marginBottom:2 }}>이번 달 사용</p>
              <p style={{ fontSize:10, fontWeight:700, color:TEXT, marginBottom:2 }}>750,000원</p>
              <p style={{ fontSize:6, fontWeight:600, color:SUCCESS }}>잔여 250,000원</p>
            </div>
          </div>
          {/* AI 조언 버튼 */}
          <div style={{ marginTop:5, background:`${PRIMARY}10`, borderRadius:7, padding:'4px 0', textAlign:'center', fontSize:6, color:PRIMARY, fontWeight:600 }}>✨ AI 조언 보기</div>
        </div>

        {/* 다가오는 결제 — 실제: 큰 아이콘 + D-day 뱃지 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'8px 10px', marginBottom:6, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:8, fontWeight:700, color:TEXT, marginBottom:6 }}>다가오는 결제</p>
          {[{ title:'월세', dueDay:1, days:3, amount:'500,000', urgency:'#FF5A5F', urgencyBg:'#FFF1F1' },
            { title:'티빙', dueDay:5, days:8, amount:'13,900', urgency:'#F59E0B', urgencyBg:'#FFFBEB' }].map((item,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:i===0?`1px solid ${BORDER}`:'none' }}>
              <div style={{ width:24, height:24, borderRadius:8, background:item.urgencyBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={item.urgency} strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:7, fontWeight:600, color:TEXT }}>{item.title}</p>
                <p style={{ fontSize:5.5, color:TEXT2 }}>매월 {item.dueDay}일</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:7, fontWeight:700, color:DANGER, marginBottom:2 }}>-{item.amount}원</p>
                <span style={{ fontSize:5.5, fontWeight:700, color:'white', background:item.urgency, borderRadius:9999, padding:'1.5px 5px' }}>D-{item.days}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 카테고리별 지출 — 실제: 도넛 차트 + 가로 프로그레스 바 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'8px 10px', marginBottom:6, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:8, fontWeight:700, color:TEXT, marginBottom:6 }}>카테고리별 지출</p>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* 도넛 차트 */}
            <div style={{ position:'relative', width:44, height:44, flexShrink:0 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:`conic-gradient(#FF6B6B 0% 65%, #4ECDC4 65% 80%, #45B7D1 80% 100%)` }}/>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:22, height:22, borderRadius:'50%', background:BG_CARD, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontSize:4, color:TEXT2 }}>총 지출</p>
                <p style={{ fontSize:5.5, fontWeight:700, color:TEXT }}>75만원</p>
              </div>
            </div>
            {/* 가로 프로그레스 바 목록 */}
            <div style={{ flex:1 }}>
              {categories.map(([name, color, pct]) => (
                <div key={name} style={{ marginBottom:4 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:color }}/>
                      <span style={{ fontSize:6, color:TEXT }}>{name}</span>
                    </div>
                    <span style={{ fontSize:6, color:TEXT2, fontWeight:600 }}>{pct}%</span>
                  </div>
                  <div style={{ height:3.5, background:`${color}25`, borderRadius:9999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:barsOn?`${pct}%`:'0%', background:color, borderRadius:9999, transition:'width 0.6s ease' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 최근 내역 — 실제: 이모지 아이콘 + 날짜·카테고리 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'8px 10px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <p style={{ fontSize:8, fontWeight:700, color:TEXT }}>최근 내역</p>
            <span style={{ fontSize:6, color:PRIMARY, fontWeight:600 }}>전체보기 ›</span>
          </div>
          {[{t:'투썸플레이스',c:'식비',d:'06/02',a:'-6,500',tp:'e'},{t:'급여',c:'급여',d:'06/01',a:'+2,000,000',tp:'i'}].map((item,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 0', borderBottom:i===0?`1px solid ${BORDER}`:'none' }}>
              <div style={{ width:24, height:24, borderRadius:8, background:item.tp==='e'?'#FFF1F1':'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>
                {item.tp==='e'?'💸':'💰'}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:7, fontWeight:500, color:TEXT }}>{item.t}</p>
                <p style={{ fontSize:5.5, color:TEXT2 }}>{item.d} · {item.c}</p>
              </div>
              <p style={{ fontSize:7, fontWeight:700, color:item.tp==='e'?DANGER:SUCCESS }}>{item.a}원</p>
            </div>
          ))}
        </div>
      </div>
      <BottomNavMockup active="홈" />
    </div>
  )
}

/* ───────── 캘린더 목업 ───────── */
function CalendarMockup() {
  const days = ['일','월','화','수','목','금','토']
  const weeks = [[1,2,3,4,5,6,7],[8,9,10,11,12,13,14],[15,16,17,18,19,20,21]]
  const exp = { 3:'-6,500', 7:'-28,000', 15:'-50,000', 20:'-8,000' }
  const inc = { 10:'+500,000' }
  const fixedDue = [1, 5, 10, 15]
  return (
    <div style={{ flex:1, background:BG_PAGE, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 월 네비게이션 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 12px', background:BG_CARD, borderBottom:`1px solid ${BORDER}`, flexShrink:0 }}>
        <span style={{ fontSize:9, color:TEXT2 }}>‹</span>
        <span style={{ fontSize:9, fontWeight:700, color:TEXT }}>2026년 6월</span>
        <span style={{ fontSize:9, color:TEXT2 }}>›</span>
      </div>
      {/* 요일 헤더 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'4px 6px 0', background:BG_CARD, flexShrink:0 }}>
        {days.map((d,i)=>(
          <div key={d} style={{ textAlign:'center', fontSize:6.5, color:i===0?DANGER:i===6?PRIMARY:TEXT2, padding:'2px 0' }}>{d}</div>
        ))}
      </div>
      {/* 날짜 그리드 */}
      <div style={{ padding:'0 6px 4px', background:BG_CARD, flexShrink:0 }}>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:2 }}>
            {week.map(day=>(
              <div key={day} style={{ textAlign:'center', padding:'1px 0' }}>
                <div style={{ fontSize:7.5, color: day===2 ? '#fff' : TEXT, fontWeight:day===2?700:400,
                  background:day===2?PRIMARY:'transparent', borderRadius:'50%', width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>{day}</div>
                {/* 고정지출 납부일 표시 */}
                {fixedDue.includes(day) && <div style={{ width:4, height:4, borderRadius:'50%', background:`${PRIMARY}60`, margin:'1px auto 0' }}/>}
                {exp[day] && <div style={{ fontSize:4.5, color:DANGER, lineHeight:1.2 }}>{exp[day]}</div>}
                {inc[day] && <div style={{ fontSize:4.5, color:SUCCESS, lineHeight:1.2 }}>{inc[day]}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* 스크롤 영역 */}
      <div style={{ flex:1, overflow:'hidden', padding:'5px 7px' }}>
        {/* 주간/월간 요약 */}
        <div style={{ display:'flex', gap:4, marginBottom:4 }}>
          <div style={{ flex:1, background:'#FFF1F1', borderRadius:10, padding:'5px 7px' }}>
            <div style={{ fontSize:5.5, color:TEXT2 }}>이번 주 지출</div>
            <div style={{ fontSize:8, fontWeight:700, color:DANGER }}>-125,000원</div>
          </div>
          <div style={{ flex:1, background:'#F0FDF4', borderRadius:10, padding:'5px 7px' }}>
            <div style={{ fontSize:5.5, color:TEXT2 }}>이번 주 수입</div>
            <div style={{ fontSize:8, fontWeight:700, color:SUCCESS }}>+500,000원</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:4, marginBottom:6 }}>
          <div style={{ flex:1, background:'#FFF1F1', borderRadius:10, padding:'5px 7px' }}>
            <div style={{ fontSize:5.5, color:TEXT2 }}>6월 지출</div>
            <div style={{ fontSize:8, fontWeight:700, color:DANGER }}>-750,000원</div>
          </div>
          <div style={{ flex:1, background:'#F0FDF4', borderRadius:10, padding:'5px 7px' }}>
            <div style={{ fontSize:5.5, color:TEXT2 }}>6월 수입</div>
            <div style={{ fontSize:8, fontWeight:700, color:SUCCESS }}>+2,000,000원</div>
          </div>
        </div>
        {/* 고정지출 — 실제: 체크박스 + 납부일 + 결제수단 */}
        <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:5 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <p style={{ fontSize:8, fontWeight:700, color:TEXT }}>고정지출</p>
            <span style={{ fontSize:5.5, background:`${PRIMARY}15`, color:PRIMARY, borderRadius:9999, padding:'1px 6px', fontWeight:600 }}>4건</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
            {[{n:'월세',d:1,a:'500,000',paid:true},{n:'티빙',d:5,a:'13,900',paid:false},{n:'보험료',d:10,a:'85,000',paid:true},{n:'통신비',d:15,a:'55,000',paid:false}].map(item=>(
              <div key={item.n} style={{ background:BG_CARD, borderRadius:10, padding:'5px 7px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:1 }}>
                  <div style={{ width:8, height:8, borderRadius:3, background:item.paid?PRIMARY:'#E5E8EB', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {item.paid && <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize:6, fontWeight:600, color:item.paid?TEXT2:TEXT, textDecoration:item.paid?'line-through':'none' }}>{item.n}</span>
                </div>
                <div style={{ fontSize:5, color:TEXT2 }}>매월 {item.d}일</div>
                <div style={{ fontSize:7, fontWeight:600, color:item.paid?TEXT2:DANGER }}>{item.a}원</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNavMockup active="캘린더" />
    </div>
  )
}

/* ───────── 가계부 목업 ───────── */
function LedgerMockup() {
  const items = [
    {date:'06/02',sep:'-7,900',rows:[{t:'투썸플레이스',c:'식비',a:'-6,500',tp:'e'},{t:'버스',c:'교통',a:'-1,400',tp:'e'}]},
    {date:'06/01',sep:'+2,000,000',rows:[{t:'급여',c:'급여',a:'+2,000,000',tp:'i'}]}
  ]
  return (
    <div style={{ flex:1, background:BG_PAGE, overflow:'hidden', position:'relative', display:'flex', flexDirection:'column' }}>
      {/* 헤더 */}
      <div style={{ background:BG_CARD, padding:'7px 10px', borderBottom:`1px solid ${BORDER}`, flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
          <span style={{ fontSize:11, fontWeight:700, color:TEXT }}>가계부</span>
          <div style={{ width:22, height:22, borderRadius:8, background:BG_PAGE, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEXT2} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
        </div>
        {/* 기간 탭 */}
        <div style={{ display:'flex', gap:4, marginBottom:4 }}>
          {['주간','월간','직접'].map((t,i)=>(
            <div key={t} style={{ padding:'2px 9px', borderRadius:9999, background:i===1?PRIMARY:BG_PAGE, fontSize:7, color:i===1?'white':TEXT2, fontWeight:i===1?700:400 }}>{t}</div>
          ))}
        </div>
        {/* 월 네비 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:6.5, color:TEXT2 }}>‹</span>
          <span style={{ fontSize:8, fontWeight:700, color:TEXT }}>2026년 6월</span>
          <span style={{ fontSize:6.5, color:TEXT2 }}>›</span>
        </div>
        {/* 수입/지출 요약 */}
        <div style={{ display:'flex', gap:6 }}>
          <div style={{ flex:1, background:'#F0FDF4', borderRadius:8, padding:'4px 6px' }}>
            <div style={{ fontSize:5.5, color:TEXT2 }}>수입</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:SUCCESS }}>+2,000,000원</div>
          </div>
          <div style={{ flex:1, background:'#FFF1F1', borderRadius:8, padding:'4px 6px' }}>
            <div style={{ fontSize:5.5, color:TEXT2 }}>지출</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:DANGER }}>-750,000원</div>
          </div>
        </div>
      </div>
      {/* 유형 탭 + 정렬 */}
      <div style={{ background:BG_CARD, padding:'4px 8px', borderBottom:`1px solid ${BORDER}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ display:'flex', gap:3 }}>
          {['전체','소비','수입','이체'].map((t,i)=>(
            <div key={t} style={{ padding:'2px 6px', borderRadius:9999, background:i===0?TEXT:BG_PAGE, fontSize:6, color:i===0?'white':TEXT2, fontWeight:i===0?700:400 }}>{t}</div>
          ))}
        </div>
        <span style={{ fontSize:6, color:TEXT2 }}>↓ 최신순</span>
      </div>
      {/* 내역 */}
      <div style={{ flex:1, overflow:'hidden', padding:'4px 7px' }}>
        {items.map(({date,sep,rows})=>(
          <div key={date}>
            <div style={{ display:'flex', alignItems:'center', gap:4, margin:'4px 0 3px' }}>
              <span style={{ fontSize:6.5, color:TEXT2, fontWeight:600 }}>{date}</span>
              <div style={{ flex:1, height:0.5, background:'#E5E8EB' }}/>
              <span style={{ fontSize:6.5, color:TEXT2 }}>{sep}</span>
            </div>
            {rows.map((item)=>(
              <div key={item.t} style={{ background:BG_CARD, borderRadius:12, padding:'6px 8px', marginBottom:3, display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ width:22, height:22, borderRadius:8, background:item.tp==='e'?'#FFF1F1':'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11 }}>
                  {item.tp==='e'?'💸':'💰'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:7.5, fontWeight:500, color:TEXT }}>{item.t}</div>
                  <div style={{ fontSize:5.5, color:TEXT2 }}>{item.c}</div>
                </div>
                <div style={{ fontSize:7.5, fontWeight:700, color:item.tp==='e'?DANGER:SUCCESS }}>{item.a}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* FAB */}
      <div style={{ position:'absolute', bottom:36, right:8, width:28, height:28, borderRadius:9999, background:PRIMARY, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(49,130,246,0.4)' }}>
        <span style={{ color:'white', fontSize:18, lineHeight:1, marginTop:-1 }}>+</span>
      </div>
      <BottomNavMockup active="가계부" />
    </div>
  )
}

/* ───────── 분석 목업 ───────── */
function AnalysisMockup() {
  const score = useCountUp(78, 900, 900)
  const [barsOn, setBarsOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBarsOn(true), 500); return () => clearTimeout(t) }, [])
  const bars = [45,20,80,30,65,45,90,35,50,20,40,15]
  return (
    <div style={{ flex:1, background:BG_PAGE, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 월 헤더 */}
      <div style={{ background:BG_CARD, padding:'6px 10px', borderBottom:`1px solid ${BORDER}`, flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:7, color:TEXT2 }}>‹</span>
        <span style={{ fontSize:9, fontWeight:700, color:TEXT }}>2026년 6월</span>
        <span style={{ fontSize:7, color:TEXT2 }}>›</span>
      </div>
      <div style={{ flex:1, overflow:'hidden', padding:'5px 6px', display:'flex', flexDirection:'column', gap:4 }}>
        {/* 탭 */}
        <div style={{ display:'flex', background:'#F2F4F6', borderRadius:9999, padding:3, flexShrink:0 }}>
          <div style={{ flex:1, padding:'3px', borderRadius:9999, background:PRIMARY, textAlign:'center', fontSize:7, color:'white', fontWeight:700 }}>소비</div>
          <div style={{ flex:1, padding:'3px', borderRadius:9999, textAlign:'center', fontSize:7, color:TEXT2 }}>공과금</div>
        </div>
        {/* 지난 달 대비 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'6px 8px', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:7.5, fontWeight:700, color:TEXT, marginBottom:4 }}>지난 달 대비</div>
          <div style={{ display:'flex', gap:4 }}>
            <div style={{ flex:1, background:'#FFF1F1', borderRadius:8, padding:'4px 6px' }}>
              <div style={{ fontSize:5.5, color:TEXT2 }}>지출</div>
              <div style={{ fontSize:8, fontWeight:700, color:DANGER }}>750,000원</div>
              <div style={{ fontSize:5.5, color:DANGER }}>▲ 5.2%</div>
            </div>
            <div style={{ flex:1, background:'#F0FDF4', borderRadius:8, padding:'4px 6px' }}>
              <div style={{ fontSize:5.5, color:TEXT2 }}>수입</div>
              <div style={{ fontSize:8, fontWeight:700, color:SUCCESS }}>2,000,000원</div>
              <div style={{ fontSize:5.5, color:TEXT2 }}>변동없음</div>
            </div>
          </div>
        </div>
        {/* 일별 지출 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'6px 8px', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:7.5, fontWeight:700, color:TEXT, marginBottom:4 }}>일별 지출</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:1.5, height:22 }}>
            {bars.map((h,i)=>(
              <div key={i} style={{ flex:1, background:i===bars.indexOf(Math.max(...bars))?PRIMARY:'#C9CDD4', borderRadius:'2px 2px 0 0',
                height:`${h}%`, transformOrigin:'bottom', transform:barsOn?'scaleY(1)':'scaleY(0)', transition:`transform 0.6s ${0.5+i*0.04}s ease` }}/>
            ))}
          </div>
        </div>
        {/* 카테고리별 지출 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'6px 8px', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:7.5, fontWeight:700, color:TEXT, marginBottom:4 }}>카테고리별 지출</div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ position:'relative', width:36, height:36, flexShrink:0 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:`conic-gradient(#FF6B6B 0% 65%, #4ECDC4 65% 80%, #45B7D1 80% 100%)` }}/>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', background:BG_CARD }}/>
            </div>
            <div style={{ flex:1 }}>
              {[['식비','#FF6B6B','65%'],['교통','#4ECDC4','15%'],['쇼핑','#45B7D1','20%']].map(([n,c,w])=>(
                <div key={n} style={{ display:'flex', alignItems:'center', gap:3, marginBottom:2 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:c }}/>
                  <span style={{ fontSize:6, color:TEXT, flex:1 }}>{n}</span>
                  <span style={{ fontSize:6, color:TEXT2 }}>{w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* AI 소비 분석 — 실제: 점수 + 요약 카드 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'6px 8px', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
            <span style={{ fontSize:7.5, fontWeight:700, color:TEXT }}>AI 소비 분석</span>
            <div style={{ background:'#F0FDF4', borderRadius:8, padding:'2px 6px', fontSize:6, color:SUCCESS, fontWeight:700, display:'flex', alignItems:'center', gap:2 }}>{score}점 ★</div>
          </div>
          <div style={{ background:'#F0FDF4', borderRadius:8, padding:'4px 6px', borderLeft:`2px solid ${SUCCESS}` }}>
            <div style={{ fontSize:5.5, color:TEXT, lineHeight:1.5 }}>식비 전월 대비 15% 증가. 외식 줄이면 ~50,000원 절약!</div>
          </div>
        </div>
      </div>
      <BottomNavMockup active="분석" />
    </div>
  )
}

/* ───────── 분석 공과금 탭 목업 ───────── */
function AnalysisUtilityMockup() {
  const [barsOn, setBarsOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBarsOn(true), 300); return () => clearTimeout(t) }, [])
  const items = [
    {icon:'🏠',name:'관리비',amount:'80,000',diff:'+2,000',up:true,bars:[65,70,68,72,75,80]},
    {icon:'💧',name:'수도세',amount:'25,000',diff:'+3,000',up:true,bars:[20,22,20,21,22,25]},
    {icon:'⚡',name:'전기세',amount:'45,000',diff:'-13,000',up:false,bars:[60,55,70,65,58,45]},
    {icon:'🔥',name:'가스비',amount:'12,000',diff:'-23,000',up:false,bars:[40,35,30,28,35,12]},
  ]
  return (
    <div style={{ flex:1, background:BG_PAGE, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 월 헤더 */}
      <div style={{ background:BG_CARD, padding:'6px 10px', borderBottom:`1px solid ${BORDER}`, flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:7, color:TEXT2 }}>‹</span>
        <span style={{ fontSize:9, fontWeight:700, color:TEXT }}>2026년 6월</span>
        <span style={{ fontSize:7, color:TEXT2 }}>›</span>
      </div>
      <div style={{ flex:1, overflow:'hidden', padding:'5px 6px', display:'flex', flexDirection:'column', gap:4 }}>
        {/* 탭 */}
        <div style={{ display:'flex', background:'#F2F4F6', borderRadius:9999, padding:3, flexShrink:0 }}>
          <div style={{ flex:1, padding:'3px', borderRadius:9999, textAlign:'center', fontSize:7, color:TEXT2 }}>소비</div>
          <div style={{ flex:1, padding:'3px', borderRadius:9999, background:PRIMARY, textAlign:'center', fontSize:7, color:'white', fontWeight:700 }}>공과금</div>
        </div>
        {/* 총합 배너 */}
        <div style={{ background:`${PRIMARY}15`, borderRadius:12, padding:'5px 9px', flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:7, color:PRIMARY, fontWeight:600 }}>이번 달 공과금 총합</span>
          <span style={{ fontSize:9, fontWeight:700, color:PRIMARY }}>162,000원</span>
        </div>
        {/* 공과금 카드들 */}
        {items.map((item,idx)=>(
          <div key={item.name} style={{ background:BG_CARD, borderRadius:12, padding:'5px 7px', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:10 }}>{item.icon}</span>
                <span style={{ fontSize:7, fontWeight:600, color:TEXT }}>{item.name}</span>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:7.5, fontWeight:700, color:TEXT }}>{item.amount}원</div>
                <div style={{ fontSize:5.5, color:item.up?DANGER:SUCCESS, fontWeight:600 }}>{item.up?'▲':'▼'} {item.diff}원</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:10 }}>
              {item.bars.map((h,i)=>{
                const max = Math.max(...item.bars)
                return <div key={i} style={{ flex:1, borderRadius:'1px 1px 0 0', height:`${(h/max)*100}%`, background:i===5?PRIMARY:`${PRIMARY}44`, transformOrigin:'bottom', transform:barsOn?'scaleY(1)':'scaleY(0)', transition:`transform 0.5s ${0.3+idx*0.15+i*0.04}s ease` }}/>
              })}
            </div>
          </div>
        ))}
        {/* AI 공과금 분석 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'5px 7px', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
            <span style={{ fontSize:7.5, fontWeight:700, color:TEXT }}>AI 공과금 분석</span>
            <div style={{ background:PRIMARY, borderRadius:8, padding:'2px 6px', fontSize:5.5, color:'white', fontWeight:600 }}>✨ AI</div>
          </div>
          <div style={{ background:'#EEF2FF', borderRadius:8, padding:'4px 6px', borderLeft:`2px solid ${PRIMARY}` }}>
            <div style={{ fontSize:5.5, color:TEXT, lineHeight:1.5 }}>전기세 13,000원 절약! 가스비 전년 대비 60% 감소!</div>
          </div>
        </div>
      </div>
      <BottomNavMockup active="분석" />
    </div>
  )
}

/* ───────── MY 목업 ───────── */
function MyMockup() {
  const [barsOn, setBarsOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBarsOn(true), 500); return () => clearTimeout(t) }, [])
  return (
    <div style={{ flex:1, background:BG_PAGE, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 헤더 — 실제: 프로필 이미지 + 닉네임 + 이메일 + 설정 버튼 */}
      <div style={{ background:PRIMARY, padding:'10px 14px 14px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* 프로필 아바타 */}
          <div style={{ position:'relative' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, border:'2px solid rgba(255,255,255,0.4)', overflow:'hidden' }}>🐾</div>
            <div style={{ position:'absolute', bottom:0, right:0, width:12, height:12, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <p style={{ fontSize:12, fontWeight:700 }}>모아</p>
              <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:9999, padding:'1px 5px', fontSize:5.5, color:'white' }}>수정</div>
            </div>
            <p style={{ fontSize:7, opacity:0.7, marginTop:1 }}>moa@gmail.com</p>
          </div>
        </div>
        {/* 설정 버튼 */}
        <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
      </div>
      <div style={{ flex:1, overflow:'hidden', padding:'8px 8px 0' }}>
        {/* 총 자산 — 실제: 파란 테두리 카드 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'8px 10px', marginBottom:6, border:`1.5px solid ${PRIMARY}33`, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:7, color:TEXT2, fontWeight:700, marginBottom:3 }}>총 자산</p>
          <p style={{ fontSize:16, fontWeight:700, color:TEXT, marginBottom:5 }}>3,750,000원</p>
          <div style={{ display:'flex', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:PRIMARY }}/>
              <span style={{ fontSize:6, color:TEXT2 }}>계좌</span>
              <span style={{ fontSize:6, color:TEXT2, fontWeight:500 }}>1,630,000원</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:SUCCESS }}/>
              <span style={{ fontSize:6, color:TEXT2 }}>현금</span>
              <span style={{ fontSize:6, color:TEXT2, fontWeight:500 }}>120,000원</span>
            </div>
          </div>
        </div>
        {/* 카드 — 실제: 실적 프로그레스 바 + 달성 뱃지 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'8px 10px', marginBottom:6, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:8, fontWeight:700, color:TEXT, marginBottom:6 }}>카드</p>
          {[['신한카드',75,false],['현대카드',92,true]].map(([name,pct,done],i)=>(
            <div key={name} style={{ marginBottom:i===0?5:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontSize:7, color:TEXT }}>{name}</span>
                {done && <span style={{ fontSize:5, background:'#dcfce7', color:'#16a34a', borderRadius:9999, padding:'1px 5px', fontWeight:600 }}>달성 ✓</span>}
              </div>
              <div style={{ height:4, background:'#F2F4F6', borderRadius:9999, overflow:'hidden' }}>
                <div style={{ height:'100%', width:barsOn?`${pct}%`:'0%', background:done?SUCCESS:PRIMARY, borderRadius:9999, transition:`width 0.8s ${0.5+i*0.15}s ease` }}/>
              </div>
            </div>
          ))}
        </div>
        {/* 계좌 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'8px 10px', marginBottom:6, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize:8, fontWeight:700, color:TEXT, marginBottom:5 }}>계좌</p>
          {[['카카오뱅크','1,250,000원'],['토스뱅크','380,000원']].map(([bank,bal],i)=>(
            <div key={bank} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:i===0?`1px solid ${BORDER}`:'none' }}>
              <span style={{ fontSize:7, color:TEXT }}>{bank}</span>
              <span style={{ fontSize:7, fontWeight:600, color:TEXT }}>{bal}</span>
            </div>
          ))}
        </div>
        {/* 현금 */}
        <div style={{ background:BG_CARD, borderRadius:12, padding:'8px 10px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:8, fontWeight:700, color:TEXT }}>현금</span>
            <span style={{ fontSize:10, fontWeight:700, color:TEXT }}>120,000원</span>
          </div>
        </div>
      </div>
      <BottomNavMockup active="MY" />
    </div>
  )
}

/* ───────── MY 설정 목업 ───────── */
function MIcon({children, bg}) {
  return <div style={{ width:18, height:18, borderRadius:8, background:bg||PRIMARY, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{children}</div>
}
function SettingsRow({children, border}) {
  return <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 8px', borderBottom:border?`1px solid ${BORDER}`:'none' }}>{children}</div>
}
function SLabel({children}) {
  return <p style={{ fontSize:6, fontWeight:600, color:TEXT2, padding:'8px 4px 4px', letterSpacing:0.3 }}>{children}</p>
}
function SettingsCard({children}) {
  return <div style={{ background:BG_CARD, borderRadius:12, overflow:'hidden', marginBottom:5, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>{children}</div>
}

function MySettingsMockup() {
  const chevron = <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#C9CDD4" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
  return (
    <div style={{ flex:1, background:'#F7F8FA', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 헤더 */}
      <div style={{ background:BG_CARD, padding:'8px 10px', display:'flex', alignItems:'center', gap:6, flexShrink:0, borderBottom:`1px solid ${BORDER}` }}>
        <span style={{ fontSize:14, color:TEXT, lineHeight:1 }}>‹</span>
        <span style={{ fontSize:10, fontWeight:700, color:TEXT }}>설정</span>
      </div>
      <div style={{ flex:1, overflow:'hidden', padding:'0 6px' }}>
        {/* 기능 */}
        <SLabel>기능</SLabel>
        <SettingsCard>
          {[
            { label:'홈', desc:'표시 옵션', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            { label:'가계부', desc:'주 시작 요일, 정렬 순서, 표시 옵션', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
            { label:'분석', desc:'탭 구성 옵션', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
            { label:'MY', desc:'기능 관리', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            { label:'AI 분석', desc:'분석 스타일, 조언 표시', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 2a5 5 0 0 0-5 5c0 1.6.8 3 2 3.87V13a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.13c1.2-.87 2-2.27 2-3.87a5 5 0 0 0-5-5z"/><line x1="9" y1="19" x2="15" y2="19"/><line x1="10" y1="22" x2="14" y2="22"/></svg> },
          ].map((item, i, arr) => (
            <SettingsRow key={item.label} border={i < arr.length-1}>
              <MIcon>{item.icon}</MIcon>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:7.5, fontWeight:600, color:TEXT }}>{item.label}</p>
                <p style={{ fontSize:5, color:TEXT2 }}>{item.desc}</p>
              </div>
              {chevron}
            </SettingsRow>
          ))}
        </SettingsCard>
        <SettingsCard>
          <SettingsRow>
            <MIcon><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></MIcon>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:7.5, fontWeight:600, color:TEXT }}>카테고리 관리</p>
              <p style={{ fontSize:5, color:TEXT2 }}>지출 · 수입 카테고리 편집</p>
            </div>
            {chevron}
          </SettingsRow>
        </SettingsCard>
        {/* 디스플레이 */}
        <SLabel>디스플레이</SLabel>
        <SettingsCard>
          <SettingsRow border>
            <MIcon><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="13.5" cy="6.5" r="1.3" fill="#fff" stroke="none"/><circle cx="17.5" cy="10.5" r="1.3" fill="#fff" stroke="none"/><circle cx="8.5" cy="7.5" r="1.3" fill="#fff" stroke="none"/><circle cx="6.5" cy="12.5" r="1.3" fill="#fff" stroke="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125A1.64 1.64 0 0 1 14.441 18h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" stroke="#fff" fill="none"/></svg></MIcon>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:7.5, fontWeight:600, color:TEXT }}>테마</p>
              <p style={{ fontSize:5, color:TEXT2 }}>앱 색상 테마 변경</p>
            </div>
            {chevron}
          </SettingsRow>
          <SettingsRow>
            <MIcon><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg></MIcon>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:7.5, fontWeight:600, color:TEXT }}>글자 크기</p>
              <p style={{ fontSize:5, color:TEXT2 }}>앱 전체 글자 크기 조절</p>
            </div>
            {chevron}
          </SettingsRow>
        </SettingsCard>
        {/* 데이터 */}
        <SLabel>데이터</SLabel>
        <SettingsCard>
          <SettingsRow>
            <MIcon><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></MIcon>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:7.5, fontWeight:600, color:TEXT }}>데이터 내보내기</p>
              <p style={{ fontSize:5, color:TEXT2 }}>엑셀 · PDF 파일로 저장</p>
            </div>
            {chevron}
          </SettingsRow>
        </SettingsCard>
        {/* 앱 정보 */}
        <SLabel>앱 정보</SLabel>
        <SettingsCard>
          {[
            { label:'이용 방법', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
            { label:'업데이트 내용', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, badge:'v1.5.0' },
            { label:'피드백 보내기', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            { label:'이용약관', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            { label:'개인정보 처리방침', icon:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
          ].map((item, i, arr) => (
            <SettingsRow key={item.label} border={i < arr.length-1}>
              <MIcon>{item.icon}</MIcon>
              <p style={{ flex:1, fontSize:7.5, fontWeight:600, color:TEXT }}>{item.label}</p>
              {item.badge && <span style={{ fontSize:5.5, color:TEXT2, marginRight:3 }}>{item.badge}</span>}
              {chevron}
            </SettingsRow>
          ))}
        </SettingsCard>
        {/* 계정 */}
        <SLabel>계정</SLabel>
        <SettingsCard>
          <SettingsRow border>
            <MIcon bg="#6B7280"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></MIcon>
            <p style={{ flex:1, fontSize:7.5, fontWeight:600, color:TEXT }}>로그아웃</p>
          </SettingsRow>
          <SettingsRow>
            <MIcon bg="#EF4444"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></MIcon>
            <p style={{ flex:1, fontSize:7.5, fontWeight:600, color:'#FF3B30' }}>계정 탈퇴</p>
            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </SettingsRow>
        </SettingsCard>
      </div>
    </div>
  )
}

/* ───────── 슬라이드 데이터 ───────── */
const SLIDES = [
  { id:'home', tab:'홈', title:'홈 대시보드', desc:'이번 달 소비 현황을 한눈에',
    features:['이번 달 잔액 · 수입 · 지출 요약','반원 그래프로 예산 달성률 확인','다가오는 결제 D-day 알림','카테고리별 지출 & 최근 내역'],
    Mockup:HomeMockup, SettingsMockup:null },
  { id:'calendar', tab:'캘린더', title:'캘린더', desc:'날짜별 소비 패턴을 파악해요',
    features:['날짜별 수입 · 지출 금액 표시','주간 · 월간 합계 카드','2열 그리드 고정지출 + 납부일','날짜 클릭 시 상세 내역 확인'],
    Mockup:CalendarMockup, SettingsMockup:null },
  { id:'ledger', tab:'가계부', title:'가계부', desc:'내역 관리의 모든 것',
    features:['주간 · 월간 · 직접 기간 정렬','전체 · 소비 · 수입 · 이체 필터','카드 · 계좌 · 현금 결제수단 분류','⚙️ 카테고리 · 이월 · 공과금 탭 설정'],
    Mockup:LedgerMockup, SettingsMockup:null },
  { id:'analysis', tab:'분석', title:'분석', desc:'AI가 소비와 공과금을 분석해요',
    features:['지난 달 대비 수입 · 지출 비교','일별 · 카테고리 · 결제수단별 분석','AI 소비 점수 & 절감 팁 제안','공과금 탭: 전기 · 수도 · 가스 전월 비교'],
    Mockup:AnalysisMockup, SettingsMockup:AnalysisUtilityMockup,
    phoneLabels:['소비 분석', '공과금 분석'] },
  { id:'my', tab:'MY', title:'MY', desc:'나의 자산과 앱 설정',
    features:['총 자산 · 계좌 · 현금 잔액 관리','카드 실적 달성률 · 혜택 확인','테마 변경 (6가지 스타일)','⚙️ PDF · 엑셀 내보내기 · 피드백'],
    Mockup:MyMockup, SettingsMockup:MySettingsMockup },
]

/* ───────── 메인 컴포넌트 ───────── */
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
  const isLast = current === SLIDES.length - 1

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: BG, overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>

      <style>{`
        @keyframes moaFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes moaSlideRight {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes moaScaleIn {
          from { opacity: 0; transform: scale(0.75); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes moaSpinPie {
          from { opacity: 0; transform: scale(0.6) rotate(-40deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes moaBlink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.35; }
        }
      `}</style>

      {/* 탭 인디케이터 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 28px) 16px 12px', display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)}
            style={{ padding: '5px 12px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: 12, transition: 'all 0.2s',
              background: i === current ? PRIMARY : `${PRIMARY}15`,
              color: i === current ? 'white' : PRIMARY,
              fontWeight: i === current ? 700 : 400 }}>
            {s.tab}
          </button>
        ))}
      </div>

      {/* 폰 목업 */}
      {slide.SettingsMockup ? (
        <div style={{ display:'flex', gap:10, justifyContent:'center', padding:'0 12px' }}>
          {[[slide.Mockup, (slide.phoneLabels?.[0] || '실제 화면')], [slide.SettingsMockup, (slide.phoneLabels?.[1] || '설정 화면')]].map(([Comp,label],i)=>(
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{ width:148, height:310, background:'white', borderRadius:22, border:`2px solid ${PRIMARY}20`, overflow:'hidden', boxShadow:`0 10px 32px ${PRIMARY}18`, display:'flex', flexDirection:'column' }}>
                <div style={{ height:20, background:PRIMARY, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 10px', flexShrink:0 }}>
                  <span style={{ fontSize:7, color:'rgba(255,255,255,0.8)' }}>9:41</span>
                  <span style={{ fontSize:7, color:'rgba(255,255,255,0.8)' }}>●●●</span>
                </div>
                <Comp />
              </div>
              <span style={{ fontSize:11, color:TEXT2, fontWeight:500 }}>{label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'0 16px' }}>
          <div style={{ width:190, height:340, background:'white', borderRadius:26, border:`2px solid ${PRIMARY}20`, overflow:'hidden', boxShadow:`0 16px 48px ${PRIMARY}22`, display:'flex', flexDirection:'column' }}>
            <div style={{ height:22, background:PRIMARY, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 12px', flexShrink:0 }}>
              <span style={{ fontSize:8, color:'rgba(255,255,255,0.8)' }}>9:41</span>
              <span style={{ fontSize:8, color:'rgba(255,255,255,0.8)' }}>●●●</span>
            </div>
            <slide.Mockup />
          </div>
          <span style={{ fontSize:11, color:TEXT2, fontWeight:500 }}>실제 화면</span>
        </div>
      )}

      {/* 기능 설명 */}
      <div style={{ flex: 1, padding: '16px 28px 0', overflow: 'hidden' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: TEXT, marginBottom: 6, lineHeight: 1.3 }}>{slide.title}</h2>
        <p style={{ fontSize: 14, color: TEXT2, marginBottom: 16, lineHeight: 1.6 }}>{slide.desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slide.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, flexShrink: 0, marginTop: 5 }} />
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>{f}</p>
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
              style={{ padding: '11px 16px', borderRadius: 9999, background: 'transparent', color: TEXT2, border: 'none', fontSize: 13, cursor: 'pointer' }}>
              건너뛰기
            </button>
          )}
          <button onClick={() => isLast ? navigate('/auth') : setCurrent(c => c + 1)}
            style={{ padding: '12px 24px', borderRadius: 9999, background: PRIMARY, color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {isLast ? '시작하기 →' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
