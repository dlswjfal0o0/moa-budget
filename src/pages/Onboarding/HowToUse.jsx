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
    <div style={{ flex:1, background:'#f8f8f8', overflow:'hidden' }}>
      <div style={{ background:PRIMARY, padding:'8px 12px 10px', color:'white', animation:'moaFadeUp 0.4s ease both' }}>
        <div style={{ fontSize:8, opacity:0.8, marginBottom:1 }}>6월 가계부</div>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>1,250,000원</div>
        <div style={{ display:'flex', gap:16 }}>
          <div><div style={{ fontSize:7, opacity:0.7 }}>수입</div><div style={{ fontSize:9, fontWeight:600 }}>+2,000,000원</div></div>
          <div><div style={{ fontSize:7, opacity:0.7 }}>지출</div><div style={{ fontSize:9, fontWeight:600 }}>-750,000원</div></div>
        </div>
      </div>
      <div style={{ background:'white', margin:'5px 5px 0', borderRadius:8, padding:'6px 8px', animation:'moaFadeUp 0.5s 0.2s ease both' }}>
        <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:2 }}>월 예산</div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ position:'relative', width:110, height:62 }}>
            <svg width="110" height="62" viewBox="0 0 110 62">
              <path d="M 8 54 A 47 47 0 0 1 102 54" fill="none" stroke="#f0f0f0" strokeWidth="10" strokeLinecap="round"/>
              <path d="M 8 54 A 47 47 0 0 1 102 54" fill="none" stroke={PRIMARY} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={gaugeOn ? circ * (1 - 75/100) : circ}
                style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}/>
            </svg>
            <div style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', textAlign:'center', whiteSpace:'nowrap' }}>
              <span style={{ fontSize:14, fontWeight:800, color:'#111' }}>{pct}<span style={{ fontSize:10 }}>%</span></span>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:2 }}>
            <div style={{ textAlign:'center', animation:'moaFadeUp 0.5s 0.8s ease both' }}>
              <div style={{ fontSize:6, color:'#aaa' }}>사용</div>
              <div style={{ fontSize:8, fontWeight:600, color:'#ef4444' }}>750,000원</div>
            </div>
            <div style={{ textAlign:'center', animation:'moaFadeUp 0.5s 1.0s ease both' }}>
              <div style={{ fontSize:6, color:'#aaa' }}>잔여</div>
              <div style={{ fontSize:8, fontWeight:600, color:'#22c55e' }}>250,000원</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background:'white', margin:'4px 5px 0', borderRadius:8, padding:'6px 8px', animation:'moaFadeUp 0.5s 0.5s ease both' }}>
        <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:5 }}>카테고리별 소비</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0,
            background:`conic-gradient(#FF6B6B 0% 65%, #4ECDC4 65% 80%, #45B7D1 80% 100%)`,
            animation:'moaSpinPie 0.8s 0.7s ease both' }}/>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {[['식비','#FF6B6B','65%'],['교통','#4ECDC4','15%'],['쇼핑','#45B7D1','20%']].map(([n,c,w],i)=>(
              <div key={n} style={{ display:'flex', alignItems:'center', gap:4, animation:`moaFadeUp 0.4s ${0.9+i*0.1}s ease both` }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:c }}/>
                <span style={{ fontSize:8,color:'#555',flex:1 }}>{n}</span>
                <span style={{ fontSize:8,color:'#888' }}>{w}</span>
              </div>
            ))}
          </div>
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
    <div style={{ flex:1, background:'white', overflow:'hidden', animation:'moaFadeUp 0.5s ease both' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 10px',borderBottom:'1px solid #f0f0f0' }}>
        <span style={{ fontSize:8,color:'#888' }}>‹</span>
        <span style={{ fontSize:9,fontWeight:700,color:'#111' }}>2026년 6월</span>
        <span style={{ fontSize:8,color:'#888' }}>›</span>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',padding:'3px 4px 0' }}>
        {days.map((d,i)=>(
          <div key={d} style={{ textAlign:'center',fontSize:7,color:i===0?'#ef4444':i===6?PRIMARY:'#888',padding:'2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ padding:'0 4px' }}>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:2 }}>
            {week.map(day=>(
              <div key={day} style={{ textAlign:'center',padding:'1px 0' }}>
                <div style={{ fontSize:8,color:day===2?PRIMARY:'#111',fontWeight:day===2?700:400 }}>{day}</div>
                {exp[day] && <div style={{ fontSize:5.5,color:'#ef4444',lineHeight:1.2 }}>{exp[day]}</div>}
                {inc[day] && <div style={{ fontSize:5.5,color:'#22c55e',lineHeight:1.2 }}>{inc[day]}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:4,padding:'4px 5px 0' }}>
        <div style={{ flex:1,background:'#FFF5F5',borderRadius:5,padding:'4px 5px' }}>
          <div style={{ fontSize:6,color:'#888' }}>이번 주 지출</div>
          <div style={{ fontSize:8,fontWeight:700,color:'#ef4444' }}>-125,000원</div>
        </div>
        <div style={{ flex:1,background:'#F0FFF4',borderRadius:5,padding:'4px 5px' }}>
          <div style={{ fontSize:6,color:'#888' }}>이번 주 수입</div>
          <div style={{ fontSize:8,fontWeight:700,color:'#22c55e' }}>+500,000원</div>
        </div>
      </div>
      <div style={{ display:'flex',gap:4,padding:'3px 5px 4px' }}>
        <div style={{ flex:1,background:'#FFF5F5',borderRadius:5,padding:'4px 5px' }}>
          <div style={{ fontSize:6,color:'#888' }}>6월 지출</div>
          <div style={{ fontSize:8,fontWeight:700,color:'#ef4444' }}>-750,000원</div>
        </div>
        <div style={{ flex:1,background:'#F0FFF4',borderRadius:5,padding:'4px 5px' }}>
          <div style={{ fontSize:6,color:'#888' }}>6월 수입</div>
          <div style={{ fontSize:8,fontWeight:700,color:'#22c55e' }}>+2,000,000원</div>
        </div>
      </div>
      <div style={{ padding:'4px 5px',borderTop:'1px solid #f5f5f5' }}>
        <div style={{ fontSize:8,fontWeight:600,color:'#111',marginBottom:3 }}>고정지출</div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:3 }}>
          {[{n:'월세',d:1,a:'500,000',p:true},{n:'넷플릭스',d:5,a:'17,000',p:false},{n:'보험료',d:10,a:'85,000',p:true},{n:'통신비',d:15,a:'55,000',p:false}].map(item=>(
            <div key={item.n} style={{ background:'#f8f8f8',borderRadius:5,padding:'4px 5px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:3,marginBottom:1 }}>
                <div style={{ width:7,height:7,borderRadius:2,background:item.p?PRIMARY:'#e0e0e0',flexShrink:0 }}/>
                <span style={{ fontSize:6.5,fontWeight:600,color:item.p?'#bbb':'#111',textDecoration:item.p?'line-through':'none' }}>{item.n}</span>
              </div>
              <div style={{ fontSize:5.5,color:'#bbb' }}>매월 {item.d}일</div>
              <div style={{ fontSize:7.5,fontWeight:600,color:item.p?'#bbb':'#ef4444' }}>{item.a}원</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LedgerMockup() {
  const items = [
    {date:'06/02',sep:'-7,900',rows:[{t:'스타벅스',c:'식비',col:'#FF6B6B',a:'-6,500',tp:'e'},{t:'버스',c:'교통',col:'#4ECDC4',a:'-1,400',tp:'e'}]},
    {date:'06/01',sep:'+2,000,000',rows:[{t:'급여',c:'급여',col:'#4ADE80',a:'+2,000,000',tp:'i'},{t:'마트',c:'식비',col:'#FF6B6B',a:'-45,000',tp:'e'}]}
  ]
  let delay = 0.4
  return (
    <div style={{ flex:1,background:'#f8f8f8',overflow:'hidden',position:'relative' }}>
      <div style={{ background:'white',padding:'6px 10px',borderBottom:'1px solid #f0f0f0',animation:'moaFadeUp 0.4s 0.1s ease both' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5 }}>
          <span style={{ fontSize:10,fontWeight:700,color:'#111' }}>가계부</span>
          <span style={{ fontSize:13 }}>⚙️</span>
        </div>
        <div style={{ display:'flex',gap:5,marginBottom:4 }}>
          {['주간','월간','직접'].map((t,i)=>(
            <div key={t} style={{ padding:'2px 8px',borderRadius:20,background:i===1?PRIMARY:'#f0f0f0',fontSize:7,color:i===1?'white':'#666' }}>{t}</div>
          ))}
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div style={{ display:'flex',gap:5 }}>
            {['전체','소비','수입'].map((t,i)=>(
              <div key={t} style={{ padding:'2px 8px',borderRadius:20,background:i===0?'#111':'#f0f0f0',fontSize:7,color:i===0?'white':'#666' }}>{t}</div>
            ))}
          </div>
          <span style={{ fontSize:7,color:'#888' }}>↓ 최신순</span>
        </div>
      </div>
      <div style={{ padding:'4px 7px' }}>
        {items.map(({date,sep,rows})=>(
          <div key={date}>
            <div style={{ display:'flex',alignItems:'center',gap:5,margin:'4px 0 3px' }}>
              <span style={{ fontSize:7,color:'#aaa',fontWeight:600 }}>{date}</span>
              <div style={{ flex:1,height:0.5,background:'#e0e0e0' }}/>
              <span style={{ fontSize:7,color:'#bbb' }}>{sep}</span>
            </div>
            {rows.map((item)=> {
              const d = delay; delay += 0.12
              return (
                <div key={item.t} style={{ background:'white',borderRadius:8,padding:'5px 7px',marginBottom:3,display:'flex',alignItems:'center',gap:5,
                  animation:`moaSlideRight 0.45s ${d}s ease both` }}>
                  <div style={{ width:20,height:20,borderRadius:6,background:item.col+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <span style={{ fontSize:8,fontWeight:700,color:item.col }}>{item.c[0]}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:8,fontWeight:500,color:'#111' }}>{item.t}</div>
                    <div style={{ fontSize:6,color:'#bbb' }}>{item.c}</div>
                  </div>
                  <div style={{ fontSize:8,fontWeight:700,color:item.tp==='e'?'#ef4444':'#22c55e' }}>{item.a}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{ position:'absolute',bottom:12,right:12,width:30,height:30,borderRadius:'50%',background:PRIMARY,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
        animation:'moaScaleIn 0.5s 0.9s ease both' }}>
        <span style={{ color:'white',fontSize:20,lineHeight:1,marginTop:-1 }}>+</span>
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
    <div style={{ flex:1,background:'#f8f8f8',overflow:'hidden',padding:'4px 5px' }}>
      <div style={{ display:'flex',gap:4,marginBottom:3,animation:'moaFadeUp 0.4s ease both' }}>
        <div style={{ flex:1,padding:'3px',borderRadius:6,background:PRIMARY,textAlign:'center',fontSize:6.5,color:'white',fontWeight:700 }}>소비</div>
        <div style={{ flex:1,padding:'3px',borderRadius:6,background:'#f0f0f0',textAlign:'center',fontSize:6.5,color:'#888' }}>공과금</div>
      </div>
      <div style={{ background:'white',borderRadius:7,padding:'5px 6px',marginBottom:3,animation:'moaFadeUp 0.4s 0.15s ease both' }}>
        <div style={{ fontSize:7,fontWeight:600,color:'#111',marginBottom:3 }}>지난 달 대비</div>
        <div style={{ display:'flex',gap:4 }}>
          <div style={{ flex:1,background:'#FFF5F5',borderRadius:4,padding:'3px 4px' }}>
            <div style={{ fontSize:5.5,color:'#888' }}>지출</div>
            <div style={{ fontSize:8,fontWeight:700,color:'#ef4444' }}>750,000원</div>
            <div style={{ fontSize:5.5,color:'#ef4444' }}>▲ 5.2%</div>
          </div>
          <div style={{ flex:1,background:'#F0FFF4',borderRadius:4,padding:'3px 4px' }}>
            <div style={{ fontSize:5.5,color:'#888' }}>수입</div>
            <div style={{ fontSize:8,fontWeight:700,color:'#22c55e' }}>2,000,000원</div>
            <div style={{ fontSize:5.5,color:'#aaa' }}>변동없음</div>
          </div>
        </div>
      </div>
      <div style={{ background:'white',borderRadius:7,padding:'5px 6px',marginBottom:3,animation:'moaFadeUp 0.4s 0.3s ease both' }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
          <span style={{ fontSize:7,fontWeight:600,color:'#111' }}>예산 관리</span>
          <span style={{ fontSize:6,color:PRIMARY,fontWeight:600 }}>75%</span>
        </div>
        <div style={{ height:5,background:'#f0f0f0',borderRadius:99,overflow:'hidden' }}>
          <div style={{ height:'100%',width:'75%',background:PRIMARY,borderRadius:99,
            transformOrigin:'left',transform:barsOn?'scaleX(1)':'scaleX(0)',transition:'transform 1s 0.3s ease' }}/>
        </div>
      </div>
      <div style={{ background:'white',borderRadius:7,padding:'5px 6px',marginBottom:3,animation:'moaFadeUp 0.4s 0.45s ease both' }}>
        <div style={{ fontSize:7,fontWeight:600,color:'#111',marginBottom:3 }}>일별 지출</div>
        <div style={{ display:'flex',alignItems:'flex-end',gap:1.5,height:24 }}>
          {bars.map((h,i)=>(
            <div key={i} style={{ flex:1,background:PRIMARY,borderRadius:'1px 1px 0 0',opacity:0.75,
              height:`${h}%`,transformOrigin:'bottom',
              transform:barsOn?'scaleY(1)':'scaleY(0)',
              transition:`transform 0.6s ${0.5+i*0.04}s ease` }}/>
          ))}
        </div>
      </div>
      <div style={{ background:'white',borderRadius:7,padding:'5px 6px',marginBottom:3,animation:'moaFadeUp 0.4s 0.7s ease both' }}>
        <div style={{ fontSize:7,fontWeight:600,color:'#111',marginBottom:3 }}>카테고리별 지출</div>
        <div style={{ display:'flex',alignItems:'center',gap:5 }}>
          <div style={{ width:34,height:34,borderRadius:'50%',flexShrink:0,
            background:`conic-gradient(#FF6B6B 0% 65%, #4ECDC4 65% 80%, #45B7D1 80% 100%)`,
            animation:'moaSpinPie 0.7s 0.8s ease both' }}/>
          <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
            {[['식비','#FF6B6B','65%'],['교통','#4ECDC4','15%'],['쇼핑','#45B7D1','20%']].map(([n,c,w],i)=>(
              <div key={n} style={{ display:'flex',alignItems:'center',gap:3,animation:`moaFadeUp 0.4s ${0.85+i*0.1}s ease both` }}>
                <div style={{ width:5,height:5,borderRadius:'50%',background:c }}/>
                <span style={{ fontSize:6,color:'#555',flex:1 }}>{n}</span>
                <span style={{ fontSize:6,color:'#888' }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background:'white',borderRadius:7,padding:'5px 6px',marginBottom:3,animation:'moaScaleIn 0.5s 1.1s ease both' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3 }}>
          <span style={{ fontSize:7,fontWeight:600,color:'#111' }}>AI 소비 분석</span>
          <div style={{ background:'#F0FFF4',borderRadius:8,padding:'2px 5px',fontSize:5.5,color:'#22c55e',fontWeight:700 }}>{score}점 🌟</div>
        </div>
        <div style={{ background:'#F0FFF4',borderRadius:5,padding:'4px 5px',borderLeft:`2px solid #22c55e` }}>
          <div style={{ fontSize:5.5,color:'#555',lineHeight:1.4 }}>식비 전월 대비 15% 증가. 외식 줄이면 ~50,000원 절약!</div>
        </div>
      </div>
      <div style={{ background:'white',borderRadius:7,padding:'5px 6px',animation:'moaFadeUp 0.4s 1.4s ease both' }}>
        <div style={{ fontSize:7,fontWeight:600,color:'#111',marginBottom:3 }}>결제수단별 지출</div>
        {[['신한카드','380,000','#4F46E5'],['카카오뱅크','280,000','#22c55e'],['현금','90,000','#f59e0b']].map(([n,a,c],i)=>(
          <div key={n} style={{ display:'flex',justifyContent:'space-between',padding:'2px 0',borderBottom:'1px solid #f8f8f8',
            animation:`moaFadeUp 0.3s ${1.5+i*0.1}s ease both` }}>
            <span style={{ fontSize:6,color:'#555' }}>{n}</span>
            <span style={{ fontSize:6,fontWeight:600,color:c }}>-{a}원</span>
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
    {emoji:'🏢',name:'관리비',amount:'80,000',diff:'+2,000',up:true,bars:[65,70,68,72,75,80]},
    {emoji:'💧',name:'수도세',amount:'25,000',diff:'+3,000',up:true,bars:[20,22,20,21,22,25]},
    {emoji:'⚡',name:'전기세',amount:'45,000',diff:'-13,000',up:false,bars:[60,55,70,65,58,45]},
    {emoji:'🔥',name:'가스비',amount:'12,000',diff:'-23,000',up:false,bars:[40,35,30,28,35,12]},
  ]
  return (
    <div style={{ flex:1,background:'#f8f8f8',overflow:'hidden',padding:'4px 5px' }}>
      <div style={{ display:'flex',gap:4,marginBottom:3,animation:'moaFadeUp 0.4s ease both' }}>
        <div style={{ flex:1,padding:'3px',borderRadius:6,background:'#f0f0f0',textAlign:'center',fontSize:6.5,color:'#888' }}>소비</div>
        <div style={{ flex:1,padding:'3px',borderRadius:6,background:PRIMARY,textAlign:'center',fontSize:6.5,color:'white',fontWeight:700 }}>공과금</div>
      </div>
      {items.map((item,idx)=>(
        <div key={item.name} style={{ background:'white',borderRadius:7,padding:'5px 6px',marginBottom:3,
          animation:`moaFadeUp 0.4s ${0.2+idx*0.18}s ease both` }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3 }}>
            <div style={{ display:'flex',alignItems:'center',gap:4 }}>
              <span style={{ fontSize:13 }}>{item.emoji}</span>
              <span style={{ fontSize:8,fontWeight:600,color:'#111' }}>{item.name}</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:8,fontWeight:700,color:'#111' }}>{item.amount}원</div>
              <div style={{ fontSize:5.5,color:item.up?'#ef4444':'#22c55e',fontWeight:600 }}>
                {item.up?'▲':'▼'} {item.diff}원
              </div>
            </div>
          </div>
          <div style={{ display:'flex',gap:2,alignItems:'flex-end',height:14 }}>
            {item.bars.map((h,i)=>{
              const max = Math.max(...item.bars)
              return (
                <div key={i} style={{ flex:1,borderRadius:'1px 1px 0 0',
                  height:`${(h/max)*100}%`,background:i===5?PRIMARY:`${PRIMARY}44`,
                  transformOrigin:'bottom',
                  transform:barsOn?'scaleY(1)':'scaleY(0)',
                  transition:`transform 0.5s ${0.3+idx*0.18+i*0.05}s ease` }}/>
              )
            })}
          </div>
        </div>
      ))}
      <div style={{ background:'white',borderRadius:7,padding:'5px 6px',animation:'moaScaleIn 0.5s 1.1s ease both' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <span style={{ fontSize:7,fontWeight:600,color:'#111' }}>AI 공과금 분석</span>
          <div style={{ background:PRIMARY,borderRadius:8,padding:'2px 6px',fontSize:5.5,color:'white',
            animation:'moaBlink 1.5s 1.5s ease infinite' }}>✨ AI 분석</div>
        </div>
        <div style={{ background:'#EEF2FF',borderRadius:5,padding:'4px 5px',marginTop:4,borderLeft:`2px solid ${PRIMARY}` }}>
          <div style={{ fontSize:5.5,color:'#555',lineHeight:1.4 }}>⚡ 전기세 13,000원 절약! 🔥 가스비 전년 대비 60% 감소!</div>
        </div>
      </div>
    </div>
  )
}

function MyMockup() {
  const [barsOn, setBarsOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBarsOn(true), 500); return () => clearTimeout(t) }, [])
  return (
    <div style={{ flex:1,background:'#f8f8f8',overflow:'hidden' }}>
      <div style={{ background:PRIMARY,padding:'10px 12px',color:'white',display:'flex',justifyContent:'space-between',alignItems:'center',
        animation:'moaFadeUp 0.4s ease both' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>🐾</div>
          <div>
            <div style={{ fontSize:11,fontWeight:700 }}>모아</div>
            <div style={{ fontSize:7,opacity:0.7 }}>moa@gmail.com</div>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.2)',borderRadius:7,padding:'4px 5px',fontSize:10 }}>⚙️</div>
      </div>
      <div style={{ background:'white',margin:'4px 5px 0',borderRadius:8,padding:'6px 8px',animation:'moaFadeUp 0.4s 0.2s ease both' }}>
        <div style={{ fontSize:7,color:'#888' }}>총 자산</div>
        <div style={{ fontSize:14,fontWeight:700,color:'#111' }}>3,750,000원</div>
      </div>
      <div style={{ background:'white',margin:'4px 5px 0',borderRadius:8,padding:'6px 8px',animation:'moaFadeUp 0.4s 0.35s ease both' }}>
        <div style={{ fontSize:8,fontWeight:600,color:'#111',marginBottom:4 }}>카드 실적</div>
        {[['신한카드',75,false],['현대카드',92,true]].map(([name,pct,done],i)=>(
          <div key={name} style={{ marginBottom:4 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:2 }}>
              <span style={{ fontSize:7,color:'#111' }}>{name}</span>
              {done && <span style={{ fontSize:5.5,background:'#dcfce7',color:'#16a34a',borderRadius:10,padding:'1px 5px' }}>달성 ✓</span>}
            </div>
            <div style={{ height:4,background:'#f0f0f0',borderRadius:99,overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${pct}%`,background:done?'#22c55e':PRIMARY,borderRadius:99,
                transformOrigin:'left',
                transform:barsOn?'scaleX(1)':'scaleX(0)',
                transition:`transform 0.8s ${0.5+i*0.15}s ease` }}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:'white',margin:'4px 5px 0',borderRadius:8,padding:'6px 8px',animation:'moaFadeUp 0.4s 0.6s ease both' }}>
        <div style={{ fontSize:8,fontWeight:600,color:'#111',marginBottom:3 }}>계좌</div>
        {[['카카오뱅크','1,250,000원'],['토스뱅크','380,000원']].map(([bank,bal],i)=>(
          <div key={bank} style={{ display:'flex',justifyContent:'space-between',padding:'2px 0',borderBottom:'1px solid #f8f8f8',
            animation:`moaFadeUp 0.3s ${0.7+i*0.1}s ease both` }}>
            <span style={{ fontSize:7,color:'#333' }}>{bank}</span>
            <span style={{ fontSize:7,fontWeight:600,color:'#111' }}>{bal}</span>
          </div>
        ))}
      </div>
      <div style={{ background:'white',margin:'4px 5px 0',borderRadius:8,padding:'6px 8px',animation:'moaFadeUp 0.4s 0.9s ease both' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <span style={{ fontSize:8,fontWeight:600,color:'#111' }}>현금</span>
          <span style={{ fontSize:9,fontWeight:700,color:'#111' }}>120,000원</span>
        </div>
      </div>
    </div>
  )
}

function LedgerSettingsMockup() {
  return (
    <div style={{ flex:1,background:'white',overflow:'hidden',padding:'8px 9px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
        <span style={{ fontSize:9,fontWeight:700,color:'#111' }}>가계부 설정</span>
        <span style={{ fontSize:13,color:'#bbb' }}>×</span>
      </div>
      <p style={{ fontSize:6.5,color:'#888',fontWeight:600,marginBottom:3 }}>주 시작 요일</p>
      <div style={{ display:'flex',gap:4,marginBottom:6 }}>
        <div style={{ flex:1,padding:'4px',borderRadius:7,background:PRIMARY,textAlign:'center',fontSize:7,color:'white',fontWeight:600 }}>월요일부터</div>
        <div style={{ flex:1,padding:'4px',borderRadius:7,background:'#f0f0f0',textAlign:'center',fontSize:7,color:'#888' }}>일요일부터</div>
      </div>
      <p style={{ fontSize:6.5,color:'#888',fontWeight:600,marginBottom:3 }}>정렬 순서</p>
      <div style={{ display:'flex',gap:4,marginBottom:6 }}>
        <div style={{ flex:1,padding:'4px',borderRadius:7,background:PRIMARY,textAlign:'center',fontSize:7,color:'white',fontWeight:600 }}>↓ 최신순</div>
        <div style={{ flex:1,padding:'4px',borderRadius:7,background:'#f0f0f0',textAlign:'center',fontSize:7,color:'#888' }}>↑ 오래된순</div>
      </div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
        <div>
          <p style={{ fontSize:7,fontWeight:600,color:'#111' }}>잔여 예산 이월</p>
          <p style={{ fontSize:5.5,color:'#888' }}>남은 예산을 다음 달로 이월</p>
        </div>
        <div style={{ width:22,height:12,borderRadius:6,background:'#e0e0e0',position:'relative',flexShrink:0 }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:'white',position:'absolute',top:2,left:2 }}/>
        </div>
      </div>
      <p style={{ fontSize:6.5,color:'#888',fontWeight:600,marginBottom:3 }}>카테고리 관리</p>
      <div style={{ display:'flex',gap:3,marginBottom:4 }}>
        <div style={{ flex:1,padding:'3px',borderRadius:6,background:PRIMARY,textAlign:'center',fontSize:6.5,color:'white',fontWeight:600 }}>지출</div>
        <div style={{ flex:1,padding:'3px',borderRadius:6,background:'#f0f0f0',textAlign:'center',fontSize:6.5,color:'#888' }}>수입</div>
      </div>
      <div style={{ display:'flex',flexWrap:'wrap',gap:3,marginBottom:7 }}>
        {['🍽 식비','🚌 교통','🛍 쇼핑','🎬 문화','💊 의료'].map(c=>(
          <span key={c} style={{ fontSize:5.5,background:'#f0f0f0',borderRadius:10,padding:'2px 5px',color:'#555' }}>{c} ×</span>
        ))}
      </div>
      <div style={{ height:0.5,background:'#f0f0f0',marginBottom:6 }}/>
      <div style={{ background:'#EEF2FF',borderRadius:9,padding:'6px 8px',border:`1.5px solid ${PRIMARY}44` }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div>
            <p style={{ fontSize:7.5,fontWeight:700,color:PRIMARY }}>✨ 분석 공과금 탭</p>
            <p style={{ fontSize:5.5,color:'#666',marginTop:1 }}>ON 시 공과금 전월 비교 & AI 분석 가능</p>
          </div>
          <div style={{ width:24,height:13,borderRadius:7,background:PRIMARY,position:'relative',flexShrink:0 }}>
            <div style={{ width:9,height:9,borderRadius:'50%',background:'white',position:'absolute',top:2,right:2 }}/>
          </div>
        </div>
      </div>
    </div>
  )
}

function MySettingsMockup() {
  return (
    <div style={{ flex:1,background:'white',overflow:'hidden',padding:'8px 8px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7 }}>
        <span style={{ fontSize:9,fontWeight:700,color:'#111' }}>설정</span>
        <span style={{ fontSize:13,color:'#bbb' }}>×</span>
      </div>
      <p style={{ fontSize:6.5,fontWeight:600,color:'#888',marginBottom:4 }}>테마</p>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,marginBottom:7 }}>
        {[
          {n:'토스 (기본)',c:'#3182F6',d:'화이트&블루'},
          {n:'형광펜 (블루)',c:'#3A8BC7',d:'시원한 블루',sel:true},
          {n:'형광펜 (핑크)',c:'#C05070',d:'달콤한 핑크'},
          {n:'형광펜 (퍼플)',c:'#7050B0',d:'우아한 퍼플'},
          {n:'아날로그',c:'#6E9E2E',d:'자연 그린'},
          {n:'핀터레스트',c:'#C88A82',d:'코지한 감성'},
        ].map(t=>(
          <div key={t.n} style={{ background:t.sel?'#EEF2FF':'#f8f8f8',borderRadius:6,padding:'4px 5px',border:t.sel?`1.5px solid ${PRIMARY}`:'1.5px solid transparent' }}>
            <div style={{ display:'flex',alignItems:'center',gap:3,marginBottom:1 }}>
              <div style={{ width:9,height:9,borderRadius:'50%',background:t.c,flexShrink:0 }}/>
              <span style={{ fontSize:5.5,fontWeight:600,color:'#111' }}>{t.n}</span>
            </div>
            <span style={{ fontSize:5,color:'#888' }}>{t.d}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize:6.5,fontWeight:600,color:'#888',marginBottom:4 }}>데이터 내보내기</p>
      {[['📊','엑셀로 내보내기','전체 내역을 .xlsx 파일로'],['📄','PDF로 내보내기','전체 내역을 .pdf 파일로']].map(([icon,label,desc])=>(
        <div key={label} style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 0',borderBottom:'1px solid #f8f8f8' }}>
          <div style={{ width:18,height:18,borderRadius:5,background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,flexShrink:0 }}>{icon}</div>
          <div>
            <p style={{ fontSize:7,fontWeight:600,color:'#111' }}>{label}</p>
            <p style={{ fontSize:5.5,color:'#888' }}>{desc}</p>
          </div>
        </div>
      ))}
      <div style={{ marginTop:8,padding:'6px 0',borderTop:'1px solid #f0f0f0' }}>
        <span style={{ fontSize:8,color:'#ef4444',fontWeight:600 }}>→ 로그아웃</span>
      </div>
    </div>
  )
}

const SLIDES = [
  { id:'home', tab:'홈', title:'홈 대시보드', desc:'이번 달 소비 현황을 한눈에',
    features:['이번 달 잔액 · 수입 · 지출 요약','반원 그래프로 예산 달성률 확인','카테고리별 원형 차트','최근 내역 빠른 확인'],
    Mockup:HomeMockup, SettingsMockup:null },
  { id:'calendar', tab:'달력', title:'달력', desc:'날짜별 소비 패턴을 파악해요',
    features:['날짜별 수입 · 지출 금액 표시','주간 · 월간 합계 카드','2열 그리드 고정지출 + 납부일','날짜 클릭 시 상세 내역 확인'],
    Mockup:CalendarMockup, SettingsMockup:null },
  { id:'ledger', tab:'가계부', title:'가계부', desc:'내역 관리의 모든 것',
    features:['주간 · 월간 · 직접 기간 정렬','날짜별 구분선 & 일별 합계','카드 · 계좌 · 현금 결제수단 분류','⚙️ 카테고리 · 이월 · 공과금 탭 설정'],
    Mockup:LedgerMockup, SettingsMockup:LedgerSettingsMockup },
  { id:'analysis', tab:'분석', title:'분석', desc:'AI가 소비와 공과금을 분석해요',
    features:['지난 달 대비 수입 · 지출 비교','카테고리 · 결제수단별 분석','AI 소비 점수 & 절감 팁 제안','공과금 탭: 전기 · 수도 · 가스 전월 비교'],
    Mockup:AnalysisMockup, SettingsMockup:AnalysisUtilityMockup,
    phoneLabels:['소비 분석', '공과금 분석'] },
  { id:'my', tab:'MY', title:'MY', desc:'나의 자산과 앱 설정',
    features:['카드 실적 달성률 · 혜택 확인','계좌 · 현금 잔액 & 총 자산','테마 변경 (6가지 스타일)','⚙️ PDF · 엑셀 내보내기 · 로그아웃'],
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
  const Mockup = slide.Mockup
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
        @keyframes moaGrowY {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
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
      {slide.SettingsMockup ? (
        <div style={{ display:'flex',gap:10,justifyContent:'center',padding:'0 12px' }}>
            {[[slide.Mockup, (slide.phoneLabels?.[0] || '실제 화면')], [slide.SettingsMockup, (slide.phoneLabels?.[1] || '설정 화면')]].map(([Comp,label],i)=>(
                <div key={i} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:5 }}>
                    <div style={{ width:148,height:310,background:'white',borderRadius:22,border:`2px solid ${PRIMARY}20`,overflow:'hidden',boxShadow:`0 10px 32px ${PRIMARY}18`,display:'flex',flexDirection:'column' }}>
                        <div style={{ height:20,background:PRIMARY,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 10px',flexShrink:0 }}>
                            <span style={{ fontSize:7,color:'rgba(255,255,255,0.8)' }}>9:41</span>
                            <span style={{ fontSize:7,color:'rgba(255,255,255,0.8)' }}>●●●</span>
                        </div>
                        <Comp />
                    </div>
                    <span style={{ fontSize:11,color:TEXT2,fontWeight:500 }}>{label}</span>
                </div>
            ))}
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:5,padding:'0 16px' }}>
            <div style={{ width:190,height:340,background:'white',borderRadius:26,border:`2px solid ${PRIMARY}20`,overflow:'hidden',boxShadow:`0 16px 48px ${PRIMARY}22`,display:'flex',flexDirection:'column' }}>
                <div style={{ height:22,background:PRIMARY,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 12px',flexShrink:0 }}>
                    <span style={{ fontSize:8,color:'rgba(255,255,255,0.8)' }}>9:41</span>
                    <span style={{ fontSize:8,color:'rgba(255,255,255,0.8)' }}>●●●</span>
                </div>
                <slide.Mockup />
            </div>
            <span style={{ fontSize:11,color:TEXT2,fontWeight:500 }}>실제 화면</span>
        </div>
      )}

      {/* 기능 설명 */}
      <div style={{ flex: 1, padding: '16px 28px 0', overflow: 'hidden' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: TEXT, marginBottom: 6, letterSpacing: '0px', lineHeight: 1.3 }}>{slide.title}</h2>
        <p style={{ fontSize: 14, color: TEXT2, marginBottom: 16, letterSpacing: '0.2px', lineHeight: 1.6 }}>{slide.desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slide.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIMARY, flexShrink: 0, marginTop: 5 }} />
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0, letterSpacing: '0.1px' }}>{f}</p>
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