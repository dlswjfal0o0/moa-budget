import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const PRIMARY = '#3182F6'
const BG = '#fff'
const TEXT = '#111827'
const TEXT2 = '#6B7280'

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

function HomeMockup() {
  const [gaugeOn, setGaugeOn] = useState(false)
  const pct = useCountUp(75, 1000, 300)
  useEffect(() => { const t = setTimeout(() => setGaugeOn(true), 200); return () => clearTimeout(t) }, [])
  const circ = Math.PI * 44
  return (
    <div style={{ flex:1, background:'#f5f6f8', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 헤더 */}
      <div style={{ background:PRIMARY, padding:'8px 12px 12px', color:'white', flexShrink:0, animation:'moaFadeUp 0.4s ease both' }}>
        <div style={{ fontSize:7, opacity:0.8, marginBottom:1 }}>6월 가계부</div>
        <div style={{ fontSize:11, fontWeight:700, marginBottom:6 }}>안녕하세요</div>
        <div style={{ background:'rgba(255,255,255,0.18)', borderRadius:12, padding:'8px 10px' }}>
          <div style={{ fontSize:6.5, opacity:0.8, marginBottom:2 }}>이번 달 잔액</div>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>1,250,000원</div>
          <div style={{ display:'flex', gap:16 }}>
            <div><div style={{ fontSize:6, opacity:0.7 }}>수입</div><div style={{ fontSize:8, fontWeight:600 }}>+2,000,000원</div></div>
            <div><div style={{ fontSize:6, opacity:0.7 }}>지출</div><div style={{ fontSize:8, fontWeight:600 }}>-750,000원</div></div>
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflow:'hidden', padding:'4px 5px 0' }}>
        {/* 예산 관리 */}
        <div style={{ background:'white', borderRadius:16, padding:'6px 8px', marginBottom:4, animation:'moaFadeUp 0.5s 0.2s ease both' }}>
          <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:3 }}>예산 관리</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ position:'relative', width:70, height:40, flexShrink:0 }}>
              <svg width="70" height="40" viewBox="0 0 110 62">
                <path d="M 8 54 A 47 47 0 0 1 102 54" fill="none" stroke="#f0f0f0" strokeWidth="10" strokeLinecap="round"/>
                <path d="M 8 54 A 47 47 0 0 1 102 54" fill="none" stroke={PRIMARY} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={gaugeOn ? circ*(1-75/100) : circ}
                  style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}/>
              </svg>
              <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', textAlign:'center', whiteSpace:'nowrap' }}>
                <span style={{ fontSize:10, fontWeight:800, color:'#111' }}>{pct}<span style={{ fontSize:7 }}>%</span></span>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <div><div style={{ fontSize:5.5, color:'#aaa' }}>사용</div><div style={{ fontSize:7, fontWeight:600, color:'#ef4444' }}>750,000원</div></div>
              <div><div style={{ fontSize:5.5, color:'#aaa' }}>잔여</div><div style={{ fontSize:7, fontWeight:600, color:'#22c55e' }}>250,000원</div></div>
            </div>
          </div>
        </div>
        {/* 다가오는 결제 */}
        <div style={{ background:'white', borderRadius:16, padding:'6px 8px', marginBottom:4, animation:'moaFadeUp 0.5s 0.35s ease both' }}>
          <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:4 }}>다가오는 결제</div>
          {[{ title:'월세', days:3, amount:'500,000', color:'#ef4444', bg:'#fee2e2' },
            { title:'티빙', days:8, amount:'13,900', color:'#f59e0b', bg:'#fef3c7' }].map((item,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:5, marginBottom:i===0?3:0, background:'#f9f9f9', borderRadius:10, padding:'4px 6px' }}>
              <div style={{ width:18, height:18, borderRadius:8, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:6.5, fontWeight:600, color:'#111' }}>{item.title}</div>
                <div style={{ fontSize:5, color:'#aaa' }}>D-{item.days}</div>
              </div>
              <div style={{ fontSize:7, fontWeight:700, color:'#ef4444' }}>-{item.amount}원</div>
            </div>
          ))}
        </div>
        {/* 카테고리별 지출 */}
        <div style={{ background:'white', borderRadius:16, padding:'6px 8px', marginBottom:4, animation:'moaFadeUp 0.5s 0.5s ease both' }}>
          <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:4 }}>카테고리별 지출</div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ position:'relative', width:44, height:44, flexShrink:0, animation:'moaSpinPie 0.8s 0.7s ease both' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:`conic-gradient(#FF6B6B 0% 65%, #4ECDC4 65% 80%, #45B7D1 80% 100%)` }}/>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:22, height:22, borderRadius:'50%', background:'white' }}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {[['식비','#FF6B6B','65%'],['교통','#4ECDC4','15%'],['쇼핑','#45B7D1','20%']].map(([n,c,w])=>(
                <div key={n} style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:c }}/>
                  <span style={{ fontSize:7, color:'#555', flex:1 }}>{n}</span>
                  <span style={{ fontSize:7, color:'#888' }}>{w}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* 최근 내역 */}
        <div style={{ background:'white', borderRadius:16, padding:'6px 8px', animation:'moaFadeUp 0.5s 0.65s ease both' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <div style={{ fontSize:8, fontWeight:600, color:'#111' }}>최근 내역</div>
            <div style={{ fontSize:6, color:PRIMARY }}>전체보기 ›</div>
          </div>
          {[{t:'투썸플레이스',c:'식비',a:'-6,500',tp:'e'},{t:'급여',c:'급여',a:'+2,000,000',tp:'i'}].map((item,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 0', borderBottom: i===0?'1px solid #f8f8f8':'none' }}>
              <div style={{ width:18, height:18, borderRadius:8, background:item.tp==='e'?'#FFF0F0':'#F0FFF4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {item.tp==='e'?<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:7, color:'#111' }}>{item.t}</div>
                <div style={{ fontSize:5.5, color:'#bbb' }}>{item.c}</div>
              </div>
              <div style={{ fontSize:7, fontWeight:600, color:item.tp==='e'?'#ef4444':'#22c55e' }}>{item.a}원</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CalendarMockup() {
  const days = ['일','월','화','수','목','금','토']
  const weeks = [[1,2,3,4,5,6,7],[8,9,10,11,12,13,14],[15,16,17,18,19,20,21]]
  const exp = { 3:'-6,500', 7:'-28,000', 15:'-50,000', 20:'-8,000' }
  const inc = { 10:'+500,000' }
  return (
    <div style={{ flex:1, background:'white', overflow:'hidden', display:'flex', flexDirection:'column', animation:'moaFadeUp 0.5s ease both' }}>
      {/* 월 네비게이션 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 10px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
        <span style={{ fontSize:8, color:'#bbb' }}>‹</span>
        <span style={{ fontSize:9, fontWeight:700, color:'#111' }}>2026년 6월</span>
        <span style={{ fontSize:8, color:'#bbb' }}>›</span>
      </div>
      {/* 요일 헤더 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'3px 4px 0', flexShrink:0 }}>
        {days.map((d,i)=>(
          <div key={d} style={{ textAlign:'center', fontSize:6.5, color:i===0?'#ef4444':i===6?PRIMARY:'#888', padding:'2px 0' }}>{d}</div>
        ))}
      </div>
      {/* 날짜 그리드 */}
      <div style={{ padding:'0 4px', flexShrink:0 }}>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:2 }}>
            {week.map(day=>(
              <div key={day} style={{ textAlign:'center', padding:'1px 0' }}>
                <div style={{ fontSize:7.5, color:day===2?PRIMARY:'#111', fontWeight:day===2?700:400 }}>{day}</div>
                {exp[day] && <div style={{ fontSize:5, color:'#ef4444', lineHeight:1.2 }}>{exp[day]}</div>}
                {inc[day] && <div style={{ fontSize:5, color:'#22c55e', lineHeight:1.2 }}>{inc[day]}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* 스크롤 영역 */}
      <div style={{ flex:1, overflow:'hidden', padding:'3px 5px' }}>
        {/* 주간/월간 요약 */}
        <div style={{ display:'flex', gap:4, marginBottom:3 }}>
          <div style={{ flex:1, background:'#FFF5F5', borderRadius:16, padding:'4px 6px' }}>
            <div style={{ fontSize:5.5, color:'#888' }}>이번 주 지출</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:'#ef4444' }}>-125,000원</div>
          </div>
          <div style={{ flex:1, background:'#F0FFF4', borderRadius:16, padding:'4px 6px' }}>
            <div style={{ fontSize:5.5, color:'#888' }}>이번 주 수입</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:'#22c55e' }}>+500,000원</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:4, marginBottom:4 }}>
          <div style={{ flex:1, background:'#FFF5F5', borderRadius:16, padding:'4px 6px' }}>
            <div style={{ fontSize:5.5, color:'#888' }}>6월 지출</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:'#ef4444' }}>-750,000원</div>
          </div>
          <div style={{ flex:1, background:'#F0FFF4', borderRadius:16, padding:'4px 6px' }}>
            <div style={{ fontSize:5.5, color:'#888' }}>6월 수입</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:'#22c55e' }}>+2,000,000원</div>
          </div>
        </div>
        {/* 고정지출 */}
        <div style={{ borderTop:'1px solid #f5f5f5', paddingTop:4 }}>
          <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:3 }}>고정지출</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
            {[{n:'월세',d:1,a:'500,000',p:true},{n:'티빙',d:5,a:'13,900',p:false},{n:'보험료',d:10,a:'85,000',p:true},{n:'통신비',d:15,a:'55,000',p:false}].map(item=>(
              <div key={item.n} style={{ background:'#f8f8f8', borderRadius:16, padding:'4px 6px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:1 }}>
                  <div style={{ width:7, height:7, borderRadius:3, background:item.p?PRIMARY:'#e0e0e0', flexShrink:0 }}/>
                  <span style={{ fontSize:6, fontWeight:600, color:item.p?'#bbb':'#111', textDecoration:item.p?'line-through':'none' }}>{item.n}</span>
                </div>
                <div style={{ fontSize:5, color:'#bbb' }}>매월 {item.d}일</div>
                <div style={{ fontSize:7, fontWeight:600, color:item.p?'#bbb':'#ef4444' }}>{item.a}원</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LedgerMockup() {
  const items = [
    {date:'06/02',sep:'-7,900',rows:[{t:'투썸플레이스',c:'식비',col:'#FF6B6B',a:'-6,500',tp:'e'},{t:'버스',c:'교통',col:'#4ECDC4',a:'-1,400',tp:'e'}]},
    {date:'06/01',sep:'+2,000,000',rows:[{t:'급여',c:'급여',col:'#4ADE80',a:'+2,000,000',tp:'i'}]}
  ]
  let delay = 0.4
  return (
    <div style={{ flex:1, background:'#f5f6f8', overflow:'hidden', position:'relative', display:'flex', flexDirection:'column' }}>
      {/* 헤더 */}
      <div style={{ background:'white', padding:'6px 10px', borderBottom:'1px solid #f0f0f0', flexShrink:0, animation:'moaFadeUp 0.4s 0.1s ease both' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#111' }}>가계부</span>
          <div style={{ width:22, height:22, borderRadius:8, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
        </div>
        {/* 기간 탭 */}
        <div style={{ display:'flex', gap:4, marginBottom:4 }}>
          {['주간','월간','직접'].map((t,i)=>(
            <div key={t} style={{ padding:'2px 9px', borderRadius:9999, background:i===1?PRIMARY:'#f0f0f0', fontSize:7, color:i===1?'white':'#666' }}>{t}</div>
          ))}
        </div>
        {/* 월 네비 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'2px 0 3px', borderBottom:'1px solid #f5f5f5' }}>
          <span style={{ fontSize:6.5, color:'#bbb' }}>‹</span>
          <span style={{ fontSize:7.5, fontWeight:700, color:'#111' }}>2026년 6월</span>
          <span style={{ fontSize:6.5, color:'#bbb' }}>›</span>
        </div>
        {/* 유형 탭 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:3 }}>
          <div style={{ display:'flex', gap:4 }}>
            {['전체','소비','수입','이체'].map((t,i)=>(
              <div key={t} style={{ padding:'2px 6px', borderRadius:9999, background:i===0?'#111':'#f0f0f0', fontSize:6, color:i===0?'white':'#666' }}>{t}</div>
            ))}
          </div>
          <span style={{ fontSize:6.5, color:'#888' }}>↓ 최신순</span>
        </div>
      </div>
      {/* 내역 */}
      <div style={{ flex:1, overflow:'hidden', padding:'4px 7px' }}>
        {items.map(({date,sep,rows})=>(
          <div key={date}>
            <div style={{ display:'flex', alignItems:'center', gap:4, margin:'3px 0' }}>
              <span style={{ fontSize:6.5, color:'#aaa', fontWeight:600 }}>{date}</span>
              <div style={{ flex:1, height:0.5, background:'#e0e0e0' }}/>
              <span style={{ fontSize:6.5, color:'#bbb' }}>{sep}</span>
            </div>
            {rows.map((item)=> {
              const d = delay; delay += 0.12
              return (
                <div key={item.t} style={{ background:'white', borderRadius:16, padding:'5px 7px', marginBottom:3, display:'flex', alignItems:'center', gap:5,
                  animation:`moaSlideRight 0.45s ${d}s ease both` }}>
                  <div style={{ width:20, height:20, borderRadius:12, background:item.tp==='e'?'#FFF0F0':'#F0FFF4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {item.tp==='e'?<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>:<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:7.5, fontWeight:500, color:'#111' }}>{item.t}</div>
                    <div style={{ fontSize:5.5, color:'#bbb' }}>{item.c}</div>
                  </div>
                  <div style={{ fontSize:7.5, fontWeight:700, color:item.tp==='e'?'#ef4444':'#22c55e' }}>{item.a}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {/* FAB */}
      <div style={{ position:'absolute', bottom:10, right:10, width:28, height:28, borderRadius:9999, background:PRIMARY, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.2)', animation:'moaScaleIn 0.5s 0.9s ease both' }}>
        <span style={{ color:'white', fontSize:18, lineHeight:1, marginTop:-1 }}>+</span>
      </div>
    </div>
  )
}

function AnalysisMockup() {
  const score = useCountUp(78, 900, 900)
  const [barsOn, setBarsOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBarsOn(true), 500); return () => clearTimeout(t) }, [])
  const bars = [45,20,80,30,65,45,90,35,50,20,40,15]
  return (
    <div style={{ flex:1, background:'#f5f6f8', overflow:'hidden', padding:'4px 5px', display:'flex', flexDirection:'column', gap:3 }}>
      {/* 탭 */}
      <div style={{ display:'flex', background:'#f0f0f0', borderRadius:9999, padding:3, flexShrink:0 }}>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, background:PRIMARY, textAlign:'center', fontSize:6.5, color:'white', fontWeight:700 }}>소비</div>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, textAlign:'center', fontSize:6.5, color:'#888' }}>공과금</div>
      </div>
      {/* 지난 달 대비 */}
      <div style={{ background:'white', borderRadius:16, padding:'5px 7px', flexShrink:0 }}>
        <div style={{ fontSize:7, fontWeight:600, color:'#111', marginBottom:3 }}>지난 달 대비</div>
        <div style={{ display:'flex', gap:4 }}>
          <div style={{ flex:1, background:'#FFF5F5', borderRadius:12, padding:'3px 5px' }}>
            <div style={{ fontSize:5.5, color:'#888' }}>지출</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:'#ef4444' }}>750,000원</div>
            <div style={{ fontSize:5.5, color:'#ef4444' }}>▲ 5.2%</div>
          </div>
          <div style={{ flex:1, background:'#F0FFF4', borderRadius:12, padding:'3px 5px' }}>
            <div style={{ fontSize:5.5, color:'#888' }}>수입</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:'#22c55e' }}>2,000,000원</div>
            <div style={{ fontSize:5.5, color:'#aaa' }}>변동없음</div>
          </div>
        </div>
      </div>
      {/* 일별 지출 */}
      <div style={{ background:'white', borderRadius:16, padding:'5px 7px', flexShrink:0 }}>
        <div style={{ fontSize:7, fontWeight:600, color:'#111', marginBottom:3 }}>일별 지출</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:1.5, height:20 }}>
          {bars.map((h,i)=>(
            <div key={i} style={{ flex:1, background:i===bars.indexOf(Math.max(...bars))?PRIMARY:'#c8c8c8', borderRadius:'2px 2px 0 0',
              height:`${h}%`, transformOrigin:'bottom', transform:barsOn?'scaleY(1)':'scaleY(0)', transition:`transform 0.6s ${0.5+i*0.04}s ease` }}/>
          ))}
        </div>
      </div>
      {/* 카테고리별 지출 */}
      <div style={{ background:'white', borderRadius:16, padding:'5px 7px', flexShrink:0 }}>
        <div style={{ fontSize:7, fontWeight:600, color:'#111', marginBottom:3 }}>카테고리별 지출</div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ position:'relative', width:36, height:36, flexShrink:0, animation:'moaSpinPie 0.7s 0.8s ease both' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:`conic-gradient(#FF6B6B 0% 65%, #4ECDC4 65% 80%, #45B7D1 80% 100%)` }}/>
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:18, height:18, borderRadius:'50%', background:'white' }}/>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2 }}>
            {[['식비','#FF6B6B','65%'],['교통','#4ECDC4','15%'],['쇼핑','#45B7D1','20%']].map(([n,c,w])=>(
              <div key={n} style={{ display:'flex', alignItems:'center', gap:3 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:c }}/>
                <span style={{ fontSize:5.5, color:'#555', flex:1 }}>{n}</span>
                <span style={{ fontSize:5.5, color:'#888' }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* AI 분석 */}
      <div style={{ background:'white', borderRadius:16, padding:'5px 7px', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
          <span style={{ fontSize:7, fontWeight:600, color:'#111' }}>AI 소비 분석</span>
          <div style={{ background:'#F0FFF4', borderRadius:8, padding:'2px 5px', fontSize:5.5, color:'#22c55e', fontWeight:700, display:'flex', alignItems:'center', gap:2 }}>{score}점 <svg width="8" height="8" viewBox="0 0 24 24" fill="#22c55e" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
        </div>
        <div style={{ background:'#F0FFF4', borderRadius:9999, padding:'3px 5px', borderLeft:`2px solid #22c55e` }}>
          <div style={{ fontSize:5.5, color:'#555', lineHeight:1.4 }}>식비 전월 대비 15% 증가. 외식 줄이면 ~50,000원 절약!</div>
        </div>
      </div>
      {/* 결제수단별 지출 */}
      <div style={{ background:'white', borderRadius:16, padding:'5px 7px', flexShrink:0 }}>
        <div style={{ fontSize:7, fontWeight:600, color:'#111', marginBottom:3 }}>결제수단별 지출</div>
        {[['신한카드','380,000','#4F46E5'],['카카오뱅크','280,000','#22c55e'],['현금','90,000','#f59e0b']].map(([n,a,c])=>(
          <div key={n} style={{ display:'flex', justifyContent:'space-between', padding:'2px 0', borderBottom:'1px solid #f8f8f8' }}>
            <span style={{ fontSize:5.5, color:'#555' }}>{n}</span>
            <span style={{ fontSize:5.5, fontWeight:600, color:c }}>-{a}원</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisUtilityMockup() {
  const [barsOn, setBarsOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBarsOn(true), 300); return () => clearTimeout(t) }, [])
  const items = [
    {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,name:'관리비',amount:'80,000',diff:'+2,000',up:true,bars:[65,70,68,72,75,80]},
    {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,name:'수도세',amount:'25,000',diff:'+3,000',up:true,bars:[20,22,20,21,22,25]},
    {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,name:'전기세',amount:'45,000',diff:'-13,000',up:false,bars:[60,55,70,65,58,45]},
    {icon:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z"/></svg>,name:'가스비',amount:'12,000',diff:'-23,000',up:false,bars:[40,35,30,28,35,12]},
  ]
  return (
    <div style={{ flex:1, background:'#f5f6f8', overflow:'hidden', padding:'4px 5px', display:'flex', flexDirection:'column', gap:3 }}>
      {/* 탭 */}
      <div style={{ display:'flex', background:'#f0f0f0', borderRadius:9999, padding:3, flexShrink:0 }}>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, textAlign:'center', fontSize:6.5, color:'#888' }}>소비</div>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, background:PRIMARY, textAlign:'center', fontSize:6.5, color:'white', fontWeight:700 }}>공과금</div>
      </div>
      {/* 총합 배너 */}
      <div style={{ background:PRIMARY+'18', borderRadius:16, padding:'4px 8px', flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:6.5, color:PRIMARY, fontWeight:600 }}>이번 달 공과금 총합</span>
        <span style={{ fontSize:8, fontWeight:700, color:PRIMARY }}>162,000원</span>
      </div>
      {/* 공과금 카드들 */}
      {items.map((item,idx)=>(
        <div key={item.name} style={{ background:'white', borderRadius:16, padding:'4px 6px', flexShrink:0, animation:`moaFadeUp 0.4s ${0.2+idx*0.15}s ease both` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:11, height:11 }}>{item.icon}</span>
              <span style={{ fontSize:7, fontWeight:600, color:'#111' }}>{item.name}</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:7, fontWeight:700, color:'#111' }}>{item.amount}원</div>
              <div style={{ fontSize:5, color:item.up?'#ef4444':'#22c55e', fontWeight:600 }}>{item.up?'▲':'▼'} {item.diff}원</div>
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
      <div style={{ background:'white', borderRadius:16, padding:'5px 6px', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
          <span style={{ fontSize:7, fontWeight:600, color:'#111' }}>AI 공과금 분석</span>
          <div style={{ background:PRIMARY, borderRadius:8, padding:'2px 5px', fontSize:5.5, color:'white', animation:'moaBlink 1.5s 1.5s ease infinite', display:'flex', alignItems:'center', gap:2 }}><svg width="7" height="7" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>AI</div>
        </div>
        <div style={{ background:'#EEF2FF', borderRadius:9999, padding:'3px 5px', borderLeft:`2px solid ${PRIMARY}` }}>
          <div style={{ fontSize:5.5, color:'#555', lineHeight:1.4 }}>전기세 13,000원 절약! 가스비 전년 대비 60% 감소!</div>
        </div>
      </div>
    </div>
  )
}

function MyMockup() {
  const [barsOn, setBarsOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBarsOn(true), 500); return () => clearTimeout(t) }, [])
  return (
    <div style={{ flex:1, background:'#f5f6f8', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 헤더 */}
      <div style={{ background:PRIMARY, padding:'8px 12px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, animation:'moaFadeUp 0.4s ease both' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🐾</div>
          <div>
            <div style={{ fontSize:10, fontWeight:700 }}>모아</div>
            <div style={{ fontSize:6.5, opacity:0.7 }}>moa@gmail.com</div>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:12, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
      </div>
      <div style={{ flex:1, overflow:'hidden', padding:'4px 5px 0' }}>
        {/* 총 자산 */}
        <div style={{ background:'white', borderRadius:16, padding:'6px 8px', marginBottom:4, border:`1.5px solid ${PRIMARY}33`, animation:'moaFadeUp 0.4s 0.15s ease both' }}>
          <div style={{ fontSize:6.5, color:'#888', fontWeight:600, marginBottom:2 }}>총 자산</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:3 }}>3,750,000원</div>
          <div style={{ fontSize:6, color:'#aaa' }}>계좌 <span style={{ color:'#666' }}>1,630,000원</span> · 현금 <span style={{ color:'#666' }}>120,000원</span></div>
        </div>
        {/* 카드 실적 */}
        <div style={{ background:'white', borderRadius:16, padding:'6px 8px', marginBottom:4, animation:'moaFadeUp 0.4s 0.3s ease both' }}>
          <div style={{ fontSize:7.5, fontWeight:600, color:'#111', marginBottom:4 }}>카드</div>
          {[['신한카드',75,false],['현대카드',92,true]].map(([name,pct,done],i)=>(
            <div key={name} style={{ marginBottom:i===0?4:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontSize:6.5, color:'#111' }}>{name}</span>
                {done && <span style={{ fontSize:5, background:'#dcfce7', color:'#16a34a', borderRadius:9999, padding:'1px 4px' }}>달성 ✓</span>}
              </div>
              <div style={{ height:3.5, background:'#f0f0f0', borderRadius:9999, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:done?'#22c55e':PRIMARY, borderRadius:9999,
                  transformOrigin:'left', transform:barsOn?'scaleX(1)':'scaleX(0)', transition:`transform 0.8s ${0.5+i*0.15}s ease` }}/>
              </div>
            </div>
          ))}
        </div>
        {/* 계좌 */}
        <div style={{ background:'white', borderRadius:16, padding:'6px 8px', marginBottom:4, animation:'moaFadeUp 0.4s 0.5s ease both' }}>
          <div style={{ fontSize:7.5, fontWeight:600, color:'#111', marginBottom:3 }}>계좌</div>
          {[['카카오뱅크','1,250,000원'],['토스뱅크','380,000원']].map(([bank,bal],i)=>(
            <div key={bank} style={{ display:'flex', justifyContent:'space-between', padding:'2px 0', borderBottom:'1px solid #f8f8f8' }}>
              <span style={{ fontSize:6.5, color:'#333' }}>{bank}</span>
              <span style={{ fontSize:6.5, fontWeight:600, color:'#111' }}>{bal}</span>
            </div>
          ))}
        </div>
        {/* 현금 */}
        <div style={{ background:'white', borderRadius:16, padding:'6px 8px', animation:'moaFadeUp 0.4s 0.7s ease both' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:7.5, fontWeight:600, color:'#111' }}>현금</span>
            <span style={{ fontSize:8.5, fontWeight:700, color:'#111' }}>120,000원</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LedgerSettingsMockup() {
  return (
    <div style={{ flex:1, background:'white', overflow:'hidden', padding:'7px 8px', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
        <span style={{ fontSize:9, fontWeight:700, color:'#111' }}>가계부 설정</span>
        <span style={{ fontSize:13, color:'#bbb' }}>×</span>
      </div>
      <p style={{ fontSize:6.5, color:'#888', fontWeight:600, marginBottom:2 }}>주 시작 요일</p>
      <div style={{ display:'flex', background:'#f0f0f0', borderRadius:9999, padding:3, marginBottom:5 }}>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, background:PRIMARY, textAlign:'center', fontSize:6.5, color:'white', fontWeight:600 }}>월요일부터</div>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, textAlign:'center', fontSize:6.5, color:'#888' }}>일요일부터</div>
      </div>
      <p style={{ fontSize:6.5, color:'#888', fontWeight:600, marginBottom:2 }}>정렬 순서</p>
      <div style={{ display:'flex', background:'#f0f0f0', borderRadius:9999, padding:3, marginBottom:5 }}>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, background:PRIMARY, textAlign:'center', fontSize:6.5, color:'white', fontWeight:600 }}>↓ 최신순</div>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, textAlign:'center', fontSize:6.5, color:'#888' }}>↑ 오래된순</div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <div>
          <p style={{ fontSize:6.5, fontWeight:600, color:'#111' }}>잔여 예산 이월</p>
          <p style={{ fontSize:5, color:'#888' }}>남은 예산을 다음 달로 이월</p>
        </div>
        <div style={{ width:22, height:12, borderRadius:9999, background:'#e0e0e0', position:'relative', flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'white', position:'absolute', top:2, left:2 }}/>
        </div>
      </div>
      <p style={{ fontSize:6.5, color:'#888', fontWeight:600, marginBottom:2 }}>카테고리 관리</p>
      <div style={{ display:'flex', background:'#f0f0f0', borderRadius:9999, padding:3, marginBottom:4 }}>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, background:PRIMARY, textAlign:'center', fontSize:6.5, color:'white', fontWeight:600 }}>지출</div>
        <div style={{ flex:1, padding:'3px', borderRadius:9999, textAlign:'center', fontSize:6.5, color:'#888' }}>수입</div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginBottom:5 }}>
        {['🍽 식비','🚌 교통','🛍 쇼핑','🎬 문화','💊 의료'].map(c=>(
          <span key={c} style={{ fontSize:5.5, background:'#f0f0f0', borderRadius:8, padding:'2px 5px', color:'#555' }}>{c} ×</span>
        ))}
      </div>
      <div style={{ height:0.5, background:'#f0f0f0', marginBottom:5 }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <div>
          <p style={{ fontSize:6.5, fontWeight:600, color:'#111' }}>카드 대금 표시</p>
          <p style={{ fontSize:5, color:'#888' }}>대금은 회색, 지출 합계 제외</p>
        </div>
        <div style={{ width:22, height:12, borderRadius:9999, background:'#e0e0e0', position:'relative', flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'white', position:'absolute', top:2, left:2 }}/>
        </div>
      </div>
      <div style={{ height:0.5, background:'#f0f0f0', marginBottom:5 }}/>
      <div style={{ background:'#EEF2FF', borderRadius:16, padding:'5px 7px', border:`1.5px solid ${PRIMARY}44` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontSize:7, fontWeight:700, color:PRIMARY, display:'flex', alignItems:'center', gap:2 }}><svg width="8" height="8" viewBox="0 0 24 24" fill={PRIMARY} stroke="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>분석 공과금 탭</p>
            <p style={{ fontSize:5, color:'#666', marginTop:1 }}>ON 시 공과금 전월 비교 & AI 분석 가능</p>
          </div>
          <div style={{ width:22, height:12, borderRadius:9999, background:PRIMARY, position:'relative', flexShrink:0 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'white', position:'absolute', top:2, right:2 }}/>
          </div>
        </div>
      </div>
    </div>
  )
}

function MySettingsMockup() {
  const chevron = <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
  const MIcon = ({children, bg}) => (
    <div style={{ width:16, height:16, borderRadius:6, background:bg||PRIMARY, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{children}</div>
  )
  const Row = ({children, border}) => (
    <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 7px', borderBottom:border?'1px solid #F2F4F6':'none' }}>{children}</div>
  )
  const SLabel = ({children}) => (
    <p style={{ fontSize:5.5, fontWeight:600, color:'#8B95A1', padding:'6px 4px 3px', letterSpacing:0.3 }}>{children}</p>
  )
  const Card = ({children, mb}) => (
    <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', marginBottom:mb||4, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>{children}</div>
  )
  return (
    <div style={{ flex:1, background:'#F7F8FA', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* 헤더 — 흰 배경 + 다크 텍스트 */}
      <div style={{ background:'#fff', padding:'7px 10px', display:'flex', alignItems:'center', gap:5, flexShrink:0, borderBottom:'1px solid #F2F4F6' }}>
        <span style={{ fontSize:12, color:'#191F28', lineHeight:1 }}>‹</span>
        <span style={{ fontSize:9, fontWeight:700, color:'#191F28' }}>설정</span>
      </div>
      <div style={{ flex:1, overflow:'hidden', padding:'0 5px' }}>
        {/* 기능 */}
        <SLabel>기능</SLabel>
        <Card>
          {[
            { label:'홈', desc:'표시 옵션', icon:<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            { label:'가계부', desc:'주 시작 요일, 정렬 순서', icon:<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
            { label:'분석', desc:'탭 구성 옵션', icon:<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
            { label:'MY', desc:'기능 관리', icon:<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
          ].map((item, i, arr) => (
            <Row key={item.label} border={i < arr.length-1}>
              <MIcon><>{item.icon}</></MIcon>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:7, fontWeight:600, color:'#191F28' }}>{item.label}</p>
                <p style={{ fontSize:4.5, color:'#8B95A1' }}>{item.desc}</p>
              </div>
              {chevron}
            </Row>
          ))}
        </Card>
        <Card>
          <Row>
            <MIcon><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></MIcon>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:7, fontWeight:600, color:'#191F28' }}>카테고리 관리</p>
              <p style={{ fontSize:4.5, color:'#8B95A1' }}>지출 · 수입 카테고리 편집</p>
            </div>
            {chevron}
          </Row>
        </Card>
        {/* 디스플레이 */}
        <SLabel>디스플레이</SLabel>
        <Card>
          <Row>
            <MIcon><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="13.5" cy="6.5" r="1.3" fill="#fff" stroke="none"/><circle cx="17.5" cy="10.5" r="1.3" fill="#fff" stroke="none"/><circle cx="8.5" cy="7.5" r="1.3" fill="#fff" stroke="none"/><circle cx="6.5" cy="12.5" r="1.3" fill="#fff" stroke="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125A1.64 1.64 0 0 1 14.441 18h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" stroke="#fff" fill="none"/></svg></MIcon>
            <p style={{ flex:1, fontSize:7, fontWeight:600, color:'#191F28' }}>테마</p>
            {chevron}
          </Row>
        </Card>
        {/* 데이터 */}
        <SLabel>데이터</SLabel>
        <Card>
          <Row>
            <MIcon><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></MIcon>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:7, fontWeight:600, color:'#191F28' }}>데이터 내보내기</p>
              <p style={{ fontSize:4.5, color:'#8B95A1' }}>엑셀 · PDF 파일로 저장</p>
            </div>
            {chevron}
          </Row>
        </Card>
        {/* 앱 정보 */}
        <SLabel>앱 정보</SLabel>
        <Card>
          {[
            { label:'이용 방법', icon:<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
            { label:'업데이트 내용', icon:<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
            { label:'피드백 보내기', icon:<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          ].map((item, i, arr) => (
            <Row key={item.label} border={i < arr.length-1}>
              <MIcon>{item.icon}</MIcon>
              <p style={{ flex:1, fontSize:7, fontWeight:600, color:'#191F28' }}>{item.label}</p>
              {chevron}
            </Row>
          ))}
        </Card>
        {/* 계정 */}
        <SLabel>계정</SLabel>
        <Card>
          <Row border>
            <MIcon bg="#6B7280"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></MIcon>
            <p style={{ flex:1, fontSize:7, fontWeight:600, color:'#191F28' }}>로그아웃</p>
          </Row>
          <Row>
            <MIcon bg="#EF4444"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></MIcon>
            <p style={{ flex:1, fontSize:7, fontWeight:600, color:'#FF3B30' }}>계정 탈퇴</p>
            <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Row>
        </Card>
      </div>
    </div>
  )
}

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
