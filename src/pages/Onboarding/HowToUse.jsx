import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const PRIMARY = '#3182F6'
const BG = '#fff'
const TEXT = '#1A0E05'
const TEXT2 = '#8B6F5E'

function HomeMockup() {
  const circ = Math.PI * 44
  return (
    <div style={{ flex: 1, background: '#f8f8f8', overflow: 'hidden' }}>
      <div style={{ background: PRIMARY, padding: '8px 12px 10px', color: 'white' }}>
        <div style={{ fontSize: 8, opacity: 0.8, marginBottom: 1 }}>6월 가계부</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>1,250,000원</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div><div style={{ fontSize: 7, opacity: 0.7 }}>수입</div><div style={{ fontSize: 9, fontWeight: 600 }}>+2,000,000원</div></div>
          <div><div style={{ fontSize: 7, opacity: 0.7 }}>지출</div><div style={{ fontSize: 9, fontWeight: 600 }}>-750,000원</div></div>
        </div>
      </div>
      <div style={{ background: 'white', margin: '5px 5px 0', borderRadius: 8, padding: '6px 8px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#111', marginBottom: 2 }}>월 예산</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 110, height: 62 }}>
            <svg width="110" height="62" viewBox="0 0 110 62">
              <path d="M 8 54 A 47 47 0 0 1 102 54" fill="none" stroke="#f0f0f0" strokeWidth="10" strokeLinecap="round" />
              <path d="M 8 54 A 47 47 0 0 1 102 54" fill="none" stroke={PRIMARY} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * 0.25} />
            </svg>
            <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>75%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 6, color: '#aaa' }}>사용</div><div style={{ fontSize: 8, fontWeight: 600, color: '#ef4444' }}>750,000원</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 6, color: '#aaa' }}>잔여</div><div style={{ fontSize: 8, fontWeight: 600, color: '#22c55e' }}>250,000원</div></div>
          </div>
        </div>
      </div>
      <div style={{ background: 'white', margin: '4px 5px 0', borderRadius: 8, padding: '6px 8px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: '#111', marginBottom: 5 }}>카테고리별 소비</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
            background: `conic-gradient(#FF6B6B 0% 65%, #4ECDC4 65% 80%, #45B7D1 80% 90%, #96CEB4 90% 100%)` }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[['식비','#FF6B6B','65%'],['교통','#4ECDC4','15%'],['쇼핑','#45B7D1','10%']].map(([n,c,w])=>(
              <div key={n} style={{ display:'flex', alignItems:'center', gap: 4 }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:c,flexShrink:0 }}/>
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
    <div style={{ flex: 1, background: 'white', overflow: 'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 12px', borderBottom:'1px solid #f0f0f0' }}>
        <span style={{ fontSize:8, color:'#888' }}>‹</span>
        <span style={{ fontSize:9, fontWeight:700, color:'#111' }}>2026년 6월</span>
        <span style={{ fontSize:8, color:'#888' }}>›</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'3px 4px 0' }}>
        {days.map((d,i)=>(
          <div key={d} style={{ textAlign:'center', fontSize:7, color:i===0?'#ef4444':i===6?PRIMARY:'#888', padding:'2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ padding:'0 4px' }}>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:2 }}>
            {week.map(day=>(
              <div key={day} style={{ textAlign:'center', padding:'1px 0' }}>
                <div style={{ fontSize:8, color:day===2?PRIMARY:'#111', fontWeight:day===2?700:400 }}>{day}</div>
                {exp[day] && <div style={{ fontSize:5.5, color:'#ef4444', lineHeight:1.2 }}>{exp[day]}</div>}
                {inc[day] && <div style={{ fontSize:5.5, color:'#22c55e', lineHeight:1.2 }}>{inc[day]}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ padding:'4px 6px', borderTop:'1px solid #f5f5f5' }}>
        <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:4 }}>고정지출</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
          {[{n:'월세',d:1,a:'500,000',p:true},{n:'넷플릭스',d:5,a:'17,000',p:false},{n:'보험료',d:10,a:'85,000',p:true},{n:'통신비',d:15,a:'55,000',p:false}].map(item=>(
            <div key={item.n} style={{ background:'#f8f8f8', borderRadius:6, padding:'5px 6px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:1 }}>
                <div style={{ width:8,height:8,borderRadius:2, background:item.p?PRIMARY:'#e0e0e0', flexShrink:0 }}/>
                <span style={{ fontSize:7, fontWeight:600, color:item.p?'#bbb':'#111', textDecoration:item.p?'line-through':'none' }}>{item.n}</span>
              </div>
              <div style={{ fontSize:6, color:'#bbb' }}>매월 {item.d}일</div>
              <div style={{ fontSize:8, fontWeight:600, color:item.p?'#bbb':'#ef4444' }}>{item.a}원</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LedgerMockup() {
  return (
    <div style={{ flex:1, background:'#f8f8f8', overflow:'hidden', position:'relative' }}>
      <div style={{ background:'white', padding:'6px 10px', borderBottom:'1px solid #f0f0f0' }}>
        <div style={{ display:'flex', gap:5, marginBottom:4 }}>
          {['주간','월간','직접'].map((t,i)=>(
            <div key={t} style={{ padding:'2px 8px', borderRadius:20, background:i===1?PRIMARY:'#f0f0f0', fontSize:7, color:i===1?'white':'#666' }}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ padding:'4px 7px' }}>
        {[
          { date:'06/02', items:[{t:'스타벅스',c:'식비',col:'#FF6B6B',a:'-6,500',tp:'e'},{t:'버스',c:'교통',col:'#4ECDC4',a:'-1,400',tp:'e'}]},
          { date:'06/01', items:[{t:'급여',c:'급여',col:'#4ADE80',a:'+2,000,000',tp:'i'}]}
        ].map(({date,items})=>(
          <div key={date}>
            <div style={{ display:'flex', alignItems:'center', gap:5, margin:'4px 0 3px' }}>
              <span style={{ fontSize:7, color:'#aaa', fontWeight:600 }}>{date}</span>
              <div style={{ flex:1, height:0.5, background:'#e0e0e0' }}/>
            </div>
            {items.map((item,i)=>(
              <div key={i} style={{ background:'white', borderRadius:8, padding:'5px 7px', marginBottom:3, display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:20,height:20,borderRadius:6, background:item.col+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:8, fontWeight:700, color:item.col }}>{item.c[0]}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:8, fontWeight:500, color:'#111' }}>{item.t}</div>
                  <div style={{ fontSize:6, color:'#bbb' }}>{item.c}</div>
                </div>
                <div style={{ fontSize:8, fontWeight:700, color:item.tp==='e'?'#ef4444':'#22c55e' }}>{item.a}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* 설정 바텀시트 */}
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.28)' }}>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'white', borderRadius:'14px 14px 0 0', padding:'8px 12px 10px' }}>
          <div style={{ width:22,height:3,borderRadius:99, background:'#e0e0e0', margin:'0 auto 7px' }}/>
          <div style={{ fontSize:8, fontWeight:700, color:'#111', marginBottom:6 }}>⚙️ 설정</div>
          {[['주 시작 요일','월요일'],['정렬 순서','날짜 최신순'],['잔여 예산 이월','켜짐'],['카테고리 관리','8개 항목']].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #f8f8f8' }}>
              <span style={{ fontSize:7, color:'#333' }}>{k}</span>
              <span style={{ fontSize:7, color:PRIMARY, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalysisMockup() {
  const bars = [45,20,80,30,65,45,90,35,50,20,40,15]
  return (
    <div style={{ flex:1, background:'#f8f8f8', overflow:'hidden', padding:'5px 6px' }}>
      <div style={{ background:'white', borderRadius:8, padding:'6px 8px', marginBottom:4 }}>
        <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:4 }}>지난 달 대비</div>
        <div style={{ display:'flex', gap:5 }}>
          <div style={{ flex:1, background:'#FFF5F5', borderRadius:5, padding:'4px 6px' }}>
            <div style={{ fontSize:6, color:'#888' }}>지출</div>
            <div style={{ fontSize:9, fontWeight:700, color:'#ef4444' }}>750,000원</div>
            <div style={{ fontSize:6, color:'#ef4444' }}>▲ 5.2%</div>
          </div>
          <div style={{ flex:1, background:'#F0FFF4', borderRadius:5, padding:'4px 6px' }}>
            <div style={{ fontSize:6, color:'#888' }}>수입</div>
            <div style={{ fontSize:9, fontWeight:700, color:'#22c55e' }}>2,000,000원</div>
            <div style={{ fontSize:6, color:'#aaa' }}>변동없음</div>
          </div>
        </div>
      </div>
      <div style={{ background:'white', borderRadius:8, padding:'6px 8px', marginBottom:4 }}>
        <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:4 }}>일별 지출</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:28 }}>
          {bars.map((h,i)=>(
            <div key={i} style={{ flex:1, height:`${h}%`, background:PRIMARY, borderRadius:'2px 2px 0 0', opacity:0.75 }}/>
          ))}
        </div>
      </div>
      <div style={{ background:'white', borderRadius:8, padding:'6px 8px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
          <span style={{ fontSize:8, fontWeight:600, color:'#111' }}>AI 소비 분석</span>
          <div style={{ background:'#F0FFF4', borderRadius:10, padding:'2px 7px', fontSize:6, color:'#22c55e', fontWeight:600 }}>78점 🌟</div>
        </div>
        <div style={{ background:'#F0FFF4', borderRadius:6, padding:'5px 7px', borderLeft:'2px solid #22c55e', marginBottom:4 }}>
          <div style={{ fontSize:7, color:'#333', lineHeight:1.4 }}>이번 달 소비 패턴이 양호해요. 식비가 전월 대비 15% 증가했어요.</div>
        </div>
        <div style={{ background:'#f8f8f8', borderRadius:6, padding:'5px 7px' }}>
          <div style={{ fontSize:6, color:'#888', marginBottom:2 }}>💡 절감 포인트</div>
          <div style={{ fontSize:7, color:'#555' }}>외식을 주 2회로 줄이면 ~50,000원 절약 가능해요</div>
        </div>
      </div>
    </div>
  )
}

function MyMockup() {
  return (
    <div style={{ flex:1, background:'#f8f8f8', overflow:'hidden', position:'relative' }}>
      <div style={{ background:PRIMARY, padding:'10px 12px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30,height:30,borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🐾</div>
          <div>
            <div style={{ fontSize:11, fontWeight:700 }}>모아</div>
            <div style={{ fontSize:7, opacity:0.7 }}>moa@gmail.com</div>
          </div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:7, padding:'4px 5px', fontSize:10 }}>⚙️</div>
      </div>
      <div style={{ background:'white', margin:'5px 5px 0', borderRadius:8, padding:'6px 8px' }}>
        <div style={{ fontSize:7, color:'#888' }}>총 자산</div>
        <div style={{ fontSize:14, fontWeight:700, color:'#111' }}>3,750,000원</div>
      </div>
      <div style={{ background:'white', margin:'4px 5px 0', borderRadius:8, padding:'6px 8px' }}>
        <div style={{ fontSize:8, fontWeight:600, color:'#111', marginBottom:4 }}>카드 실적</div>
        {[['신한카드',75,false],['현대카드',92,true]].map(([name,pct,done])=>(
          <div key={name} style={{ marginBottom:4 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:7, color:'#111' }}>{name}</span>
              {done && <span style={{ fontSize:6, background:'#dcfce7', color:'#16a34a', borderRadius:10, padding:'1px 5px' }}>달성 ✓</span>}
            </div>
            <div style={{ height:4, background:'#f0f0f0', borderRadius:99 }}>
              <div style={{ height:'100%', width:`${pct}%`, background:done?'#22c55e':PRIMARY, borderRadius:99 }}/>
            </div>
          </div>
        ))}
      </div>
      {/* 설정 바텀시트 */}
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.28)' }}>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'white', borderRadius:'14px 14px 0 0', padding:'8px 12px 10px' }}>
          <div style={{ width:22,height:3,borderRadius:99, background:'#e0e0e0', margin:'0 auto 7px' }}/>
          <div style={{ fontSize:8, fontWeight:700, color:'#111', marginBottom:6 }}>⚙️ 설정</div>
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:7, color:'#888', marginBottom:4 }}>테마 변경</div>
            <div style={{ display:'flex', gap:5 }}>
              {['#3182F6','#C05070','#7050B0','#6E9E2E','#C88A82'].map(c=>(
                <div key={c} style={{ width:18,height:18,borderRadius:'50%',background:c,border:c==='#3182F6'?'2px solid #333':'none' }}/>
              ))}
            </div>
          </div>
          {[['PDF 내보내기',''],['엑셀 내보내기',''],['로그아웃','danger']].map(([k,type])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #f8f8f8' }}>
              <span style={{ fontSize:7, color:type==='danger'?'#ef4444':'#333' }}>{k}</span>
              <span style={{ fontSize:7, color:'#bbb' }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LedgerSettingsMockup() {
  return (
    <div style={{ flex: 1, background: '#f8f8f8', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '6px 8px' }}>
        {[{t:'스타벅스',c:'식비',col:'#FF6B6B',a:'-6,500'},{t:'버스',c:'교통',col:'#4ECDC4',a:'-1,400'}].map((item,i)=>(
          <div key={i} style={{ background:'white', borderRadius:7, padding:'5px 7px', marginBottom:3, display:'flex', alignItems:'center', gap:5, opacity:0.5 }}>
            <div style={{ width:18,height:18,borderRadius:5,background:item.col+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <span style={{ fontSize:7,fontWeight:700,color:item.col }}>{item.c[0]}</span>
            </div>
            <span style={{ fontSize:8,flex:1,color:'#111' }}>{item.t}</span>
            <span style={{ fontSize:8,fontWeight:700,color:'#ef4444' }}>{item.a}</span>
          </div>
        ))}
      </div>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.32)' }}>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'white', borderRadius:'12px 12px 0 0', padding:'8px 10px' }}>
          <div style={{ width:18,height:3,borderRadius:99,background:'#e0e0e0',margin:'0 auto 6px' }}/>
          <p style={{ fontSize:8,fontWeight:700,color:'#111',marginBottom:5 }}>⚙️ 가계부 설정</p>
          {[['주 시작 요일','월요일'],['정렬 순서','최신순'],['잔여 예산 이월','켜짐']].map(([k,v])=>(
            <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid #f8f8f8' }}>
              <span style={{ fontSize:7,color:'#333' }}>{k}</span>
              <span style={{ fontSize:7,color:PRIMARY,fontWeight:600 }}>{v}</span>
            </div>
          ))}
          <div style={{ height:0.5,background:'#f0f0f0',margin:'5px 0' }}/>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div>
              <p style={{ fontSize:7,fontWeight:600,color:'#111' }}>분석 공과금 탭</p>
              <p style={{ fontSize:6,color:'#888' }}>공과금 탭 추가</p>
            </div>
            <div style={{ width:22,height:12,borderRadius:6,background:PRIMARY,position:'relative',flexShrink:0 }}>
              <div style={{ width:8,height:8,borderRadius:'50%',background:'white',position:'absolute',top:2,right:2 }}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MySettingsMockup() {
  return (
    <div style={{ flex:1, background:'#f8f8f8', overflow:'hidden', position:'relative' }}>
      <div style={{ background:PRIMARY, padding:'8px 10px', color:'white', opacity:0.5 }}>
        <div style={{ fontSize:9, fontWeight:700 }}>모아</div>
        <div style={{ fontSize:6, opacity:0.8 }}>moa@gmail.com</div>
      </div>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.32)' }}>
        <div style={{ position:'absolute', inset:'16px 6px 0', background:'white', borderRadius:'12px 12px 0 0', padding:'8px 8px', overflow:'hidden' }}>
          <div style={{ width:18,height:3,borderRadius:99,background:'#e0e0e0',margin:'0 auto 5px' }}/>
          <p style={{ fontSize:8,fontWeight:700,color:'#111',marginBottom:5 }}>설정</p>
          <p style={{ fontSize:6,color:'#888',marginBottom:4 }}>테마</p>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,marginBottom:6 }}>
            {[{n:'토스',c:'#3182F6'},{n:'형광펜(블루)',c:'#3A8BC7',sel:true},{n:'형광펜(핑크)',c:'#C05070'},{n:'아날로그',c:'#6E9E2E'}].map(t=>(
              <div key={t.n} style={{ background:t.sel?'#EEF2FF':'#f8f8f8', borderRadius:5, padding:'3px 5px', border:t.sel?`1px solid ${PRIMARY}`:'1px solid transparent', display:'flex', alignItems:'center', gap:3 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:t.c,flexShrink:0 }}/>
                <span style={{ fontSize:5.5,color:'#333' }}>{t.n}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize:6,color:'#888',marginBottom:3 }}>데이터 내보내기</p>
          {[['📊 엑셀로 내보내기'],['📄 PDF로 내보내기']].map(([label])=>(
            <div key={label} style={{ padding:'4px 0',borderBottom:'1px solid #f8f8f8' }}>
              <span style={{ fontSize:7,color:'#333' }}>{label}</span>
            </div>
          ))}
          <div style={{ marginTop:5,padding:'4px 0' }}>
            <span style={{ fontSize:7,color:'#ef4444',fontWeight:600 }}>→ 로그아웃</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const SLIDES = [
  {
    id: 'home', tab: '홈',
    title: '홈 대시보드',
    desc: '이번 달 소비 현황을 한눈에',
    features: ['이번 달 잔액 · 수입 · 지출 요약', '반원 그래프로 예산 달성률 확인', '카테고리별 원형 차트', '최근 내역 빠른 확인'],
    Mockup: HomeMockup, SettingsMockup: null,
  },
  {
    id: 'calendar', tab: '달력',
    title: '달력',
    desc: '날짜별 소비 패턴을 파악해요',
    features: ['날짜별 수입 · 지출 금액 표시', '주간 · 월간 합계 한눈에', '2열 그리드 고정지출 + 납부일', '날짜 클릭 시 상세 내역 확인'],
    Mockup: CalendarMockup, SettingsMockup: null,
  },
  {
    id: 'ledger', tab: '가계부',
    title: '가계부',
    desc: '내역 관리의 모든 것',
    features: ['주간 · 월간 · 직접 기간 정렬', '날짜별 구분선 & 일별 합계', '카드 · 계좌 · 현금 결제수단 분류', '⚙️ 카테고리 · 이월 · 공과금 탭 설정'],
    Mockup: LedgerMockup, SettingsMockup: LedgerSettingsMockup,
  },
  {
    id: 'analysis', tab: '분석',
    title: '분석',
    desc: 'AI가 소비 패턴을 분석해요',
    features: ['지난 달 대비 수입 · 지출 비교', '일별 지출 바차트', 'AI 소비 점수 & 절감 팁 제안', '공과금 탭: 전기 · 수도 · 가스 비교'],
    Mockup: AnalysisMockup, SettingsMockup: null,
  },
  {
    id: 'my', tab: 'MY',
    title: 'MY',
    desc: '나의 자산과 앱 설정',
    features: ['카드 실적 달성률 · 혜택 · 내역 확인', '계좌 · 현금 잔액 & 총 자산', '테마 변경 (6가지 스타일)', '⚙️ PDF · 엑셀 내보내기 · 로그아웃'],
    Mockup: MyMockup, SettingsMockup: MySettingsMockup,
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
      {slide.SettingsMockup ? (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '0 12px' }}>
            {[[slide.Mockup, '실제 화면'], [slide.SettingsMockup, '설정 화면']].map(([Comp, label], i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 148, height: 310, background: 'white', borderRadius: 22, border: `2px solid ${PRIMARY}20`, overflow: 'hidden', boxShadow: `0 10px 32px ${PRIMARY}18`, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: 20, background: PRIMARY, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', flexShrink: 0 }}>
                            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)' }}>9:41</span>
                            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)' }}>●●●</span>
                        </div>
                        <Comp />
                    </div>
                    <span style={{ fontSize: 11, color: TEXT2, fontWeight: 500 }}>{label}</span>
                </div>
            ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 16px' }}>
            <div style={{ width: 190, height: 340, background: 'white', borderRadius: 26, border: `2px solid ${PRIMARY}20`, overflow: 'hidden', boxShadow: `0 16px 48px ${PRIMARY}22`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 22, background: PRIMARY, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', flexShrink: 0 }}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>9:41</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>●●●</span>
                </div>
                <slide.Mockup />
            </div>
            <span style={{ fontSize: 11, color: TEXT2, fontWeight: 500 }}>실제 화면</span>
        </div>
      )}

      {/* 기능 설명 */}
      <div style={{ flex: 1, padding: '16px 28px 0', overflow: 'hidden' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: TEXT, marginBottom: 3, letterSpacing: -0.5 }}>{slide.title}</h2>
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