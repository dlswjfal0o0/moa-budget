export function injectDemoData() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const daysBetween = (a, b) => Math.round((b - a) / 86400000)

  // ── 실행 시점 기준 상대 월 정보 (0 = 이번 달, 1..5 = 지난달들) ──
  const months = []
  for (let off = 0; off <= 5; off++) {
    const d = new Date(now.getFullYear(), now.getMonth() - off, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    months.push({ off, y, m, key: `${y}-${pad(m)}`, days: new Date(y, m, 0).getDate() })
  }
  const cur = months[0]
  const todayDate = now.getDate()

  // 월별로 금액에 소폭 변동을 줘서 시간대별로 다양하게 보이도록
  const vary = (base, off, seed) => {
    const factor = 1 + (((off * 7 + seed * 3) % 11) - 5) * 0.03 // 약 ±15%
    return Math.max(500, Math.round((base * factor) / 100) * 100)
  }

  // ── 카드 ──────────────────────────────────────────
  const cards = [
    { id: 1, cardType: '체크', name: '신한 체크카드', limit: 0, cardNumber: '1234', expiry: '28/08', linkedAccount: '신한은행', billingDay: '', creditTracking: '', color: '#3182F6' },
    { id: 2, cardType: '신용', name: 'KB국민 신용카드', limit: 500000, cardNumber: '5678', expiry: '29/03', linkedAccount: '', billingDay: '15', creditTracking: '', color: '#FFB300' },
    { id: 3, cardType: '신용', name: '삼성 신용카드', limit: 1000000, cardNumber: '9012', expiry: '28/11', linkedAccount: '', billingDay: '10', creditTracking: '', color: '#1B2B4B' },
  ]
  localStorage.setItem('moa_cards', JSON.stringify(cards))

  // ── 계좌 ──────────────────────────────────────────
  const accounts = [
    { id: 1, name: '신한은행', balance: 2850000, number: '110-123-456789' },
    { id: 2, name: '카카오뱅크', balance: 520000, number: '3333-01-7654321' },
  ]
  localStorage.setItem('moa_accounts', JSON.stringify(accounts))

  // ── 현금 ──────────────────────────────────────────
  localStorage.setItem('moa_cash', '150000')

  // ── 거래 내역 헬퍼 ─────────────────────────────────
  const tx = (id, date, type, title, amount, category, payment, memo = '', time = '12:00') => ({
    id: String(id), uid: 'demo', month: date.slice(0, 7),
    type, title, amount, category, payment, date, time,
    memo, createdAt: new Date().toISOString(), cardBilling: false, isLoan: false,
  })

  // 한 달 거래 내역 템플릿 — 일자(d)와 시간(time)을 다양하게 분포
  // t: income|expense, memo:true 이면 "N월분" 자동 부여(공과금)
  const template = [
    { d: 1,  t: 'expense', name: '스타벅스',        amt: 6500,  cat: '식비',        pay: '신한 체크카드',   time: '08:32' },
    { d: 2,  t: 'expense', name: '이마트',          amt: 87300, cat: '식비',        pay: '신한 체크카드',   time: '18:45' },
    { d: 2,  t: 'expense', name: '지하철',          amt: 1500,  cat: '교통',        pay: '신한 체크카드',   time: '08:10' },
    { d: 3,  t: 'expense', name: '올리브영',        amt: 43000, cat: '생활',        pay: 'KB국민 신용카드', time: '14:20' },
    { d: 3,  t: 'expense', name: '넷플릭스',        amt: 17000, cat: '구독',        pay: 'KB국민 신용카드', time: '00:05' },
    { d: 5,  t: 'expense', name: '주유',            amt: 65000, cat: '교통',        pay: 'KB국민 신용카드', time: '17:55' },
    { d: 6,  t: 'expense', name: '카페라떼',        amt: 8500,  cat: '식비',        pay: '신한 체크카드',   time: '09:15' },
    { d: 7,  t: 'expense', name: '의류 구매',       amt: 89000, cat: '쇼핑',        pay: '삼성 신용카드',   time: '15:40' },
    { d: 8,  t: 'expense', name: '병원비',          amt: 15000, cat: '의료/건강',   pay: '현금',            time: '11:00' },
    { d: 9,  t: 'expense', name: '마트 장보기',     amt: 56800, cat: '식비',        pay: '신한 체크카드',   time: '19:20' },
    { d: 10, t: 'income',  name: '프리랜서 수입',   amt: 300000,cat: '부수입',      pay: '카카오뱅크',      time: '10:00' },
    { d: 11, t: 'expense', name: '헬스장',          amt: 80000, cat: '스포츠/레저', pay: 'KB국민 신용카드', time: '07:30' },
    { d: 13, t: 'expense', name: '배달음식',        amt: 32000, cat: '식비',        pay: '신한 체크카드',   time: '19:05' },
    { d: 15, t: 'expense', name: '아메리카노',      amt: 7000,  cat: '식비',        pay: '신한 체크카드',   time: '08:55' },
    { d: 16, t: 'expense', name: '온라인 쇼핑',     amt: 56000, cat: '쇼핑',        pay: '삼성 신용카드',   time: '02:30' },
    { d: 17, t: 'expense', name: '외식 (삼겹살)',   amt: 45000, cat: '식비',        pay: 'KB국민 신용카드', time: '18:30' },
    { d: 19, t: 'expense', name: '마트',            amt: 34200, cat: '식비',        pay: '신한 체크카드',   time: '20:15' },
    { d: 20, t: 'expense', name: '미용실',          amt: 30000, cat: '생활',        pay: '현금',            time: '11:30' },
    { d: 21, t: 'expense', name: '영화 관람',       amt: 15000, cat: '문화/여가',   pay: 'KB국민 신용카드', time: '16:00' },
    { d: 22, t: 'expense', name: '배달음식',        amt: 28000, cat: '식비',        pay: '신한 체크카드',   time: '20:45' },
    { d: 25, t: 'expense', name: '전기요금',        amt: 33000, cat: '공과금',      pay: '신한 체크카드',   time: '09:30', memo: true },
    { d: 25, t: 'expense', name: '수도요금',        amt: 15000, cat: '공과금',      pay: '신한 체크카드',   time: '09:31', memo: true },
    { d: 25, t: 'expense', name: '가스요금',        amt: 40000, cat: '공과금',      pay: '신한 체크카드',   time: '09:32', memo: true },
    { d: 27, t: 'expense', name: '편의점',          amt: 4300,  cat: '식비',        pay: '신한 체크카드',   time: '22:10' },
    { d: 28, t: 'expense', name: '약국',            amt: 8900,  cat: '의료/건강',   pay: '현금',            time: '13:50' },
  ]

  months.forEach((info) => {
    const maxDay = info.off === 0 ? todayDate : 99
    const base = 1000 + info.off * 100
    const rows = []
    // 월급 (매달 1일)
    rows.push(tx(base, `${info.key}-01`, 'income', `${info.m}월 월급`, 3200000, '급여', '신한은행', '', '09:00'))
    template.forEach((r, i) => {
      if (r.d > maxDay || r.d > info.days) return
      const amount = r.t === 'income' ? r.amt : vary(r.amt, info.off, i)
      rows.push(
        tx(base + i + 1, `${info.key}-${pad(r.d)}`, r.t, r.name, amount, r.cat, r.pay, r.memo ? `${info.m}월분` : '', r.time)
      )
    })
    localStorage.setItem(`moa_txns_${info.key}`, JSON.stringify(rows))
  })

  // 데모에서 사용할 월 목록 (다른 화면에서 참조)
  localStorage.setItem('moa_demo_months', JSON.stringify(months.map((x) => x.key)))

  // ── 공과금 (분석 탭용, 상대 월) ────────────────────
  const utilBase = { 전기세: 33000, 수도세: 15000, 가스비: 40000, 관리비: 92000 }
  const utilities = []
  months.forEach((info) => {
    Object.entries(utilBase).forEach(([type, b], idx) => {
      utilities.push({ type, year: info.y, month: info.m, amount: vary(b, info.off, idx + 2), day: type === '관리비' ? 20 : 25 })
    })
  })
  localStorage.setItem('moa_utilities', JSON.stringify(utilities))

  // ── 고정지출 (이번 달 기준) ────────────────────────
  const fixedExpenses = [
    { id: 1, title: '월세',              amount: 550000, dueDate: `${cur.key}-05`, category: '주거',        payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 2, title: '넷플릭스',          amount: 17000,  dueDate: `${cur.key}-03`, category: '구독',        payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 3, title: '헬스장',            amount: 80000,  dueDate: `${cur.key}-11`, category: '스포츠/레저', payment: 'KB국민 신용카드', autoRegister: false, doneMonths: [], autoRegisteredMonths: [] },
    { id: 4, title: '전세자금대출 이자', amount: 285000, dueDate: `${cur.key}-25`, category: '금융',        payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 5, title: '자동차 할부',       amount: 280000, dueDate: `${cur.key}-10`, category: '교통',        payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 6, title: '유튜브 프리미엄',   amount: 14900,  dueDate: `${cur.key}-18`, category: '구독',        payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 7, title: '실손보험',          amount: 32000,  dueDate: `${cur.key}-22`, category: '의료/건강',   payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
  ]
  localStorage.setItem('moa_fixed_expenses', JSON.stringify(fixedExpenses))

  // ── 예산 (이번 달) ────────────────────────────────
  const budgets = [
    { id: 1, label: `${cur.m}월 생활비`, startDate: `${cur.key}-01`, endDate: `${cur.key}-${pad(cur.days)}`, amount: 800000, categories: ['식비', '생활'] },
    { id: 2, label: `${cur.m}월 교통비`, startDate: `${cur.key}-01`, endDate: `${cur.key}-${pad(cur.days)}`, amount: 150000, categories: ['교통'] },
  ]
  localStorage.setItem('moa_budgets', JSON.stringify(budgets))

  // ── 대출 (상대 날짜) ──────────────────────────────
  const buildLoan = (opts) => {
    const start = new Date(now.getFullYear(), now.getMonth() - opts.startMonthsAgo, opts.paymentDay)
    const maturity = new Date(now.getFullYear(), now.getMonth() + opts.maturityMonthsAhead, opts.paymentDay)
    const repayments = []
    let cumulative = 0
    for (let i = opts.repayCount; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, opts.paymentDay)
      cumulative += opts.monthlyPayment
      repayments.push({ date: fmt(d), daysElapsed: daysBetween(start, d), amount: opts.monthlyPayment, cumulativeAmount: cumulative })
    }
    return {
      id: opts.id, name: opts.name, principal: opts.principal, remainingPrincipal: opts.remainingPrincipal,
      startDate: fmt(start), rate: opts.rate, rateType: 'simple',
      monthlyPayment: opts.monthlyPayment, paymentDay: opts.paymentDay, maturityDate: fmt(maturity),
      repayments,
    }
  }
  const loans = [
    buildLoan({ id: 1, name: '전세자금대출', principal: 120000000, remainingPrincipal: 98000000, rate: 3.5, monthlyPayment: 450000, paymentDay: 25, startMonthsAgo: 39, maturityMonthsAhead: 21, repayCount: 6 }),
    buildLoan({ id: 2, name: '자동차 할부', principal: 18000000, remainingPrincipal: 12000000, rate: 5.2, monthlyPayment: 280000, paymentDay: 10, startMonthsAgo: 30, maturityMonthsAhead: 6, repayCount: 6 }),
  ]
  localStorage.setItem('moa_loans', JSON.stringify(loans))

  // ── 예산 AI 조언 샘플 ─────────────────────────────
  const budgetInsights = {
    1: {
      status: 'warning',
      summary: '생활비 예산의 72%를 사용했어요. 남은 기간 동안 하루 약 7,400원씩 쓸 수 있어요.',
      tips: [
        { icon: 'food',   title: '식비 조절이 필요해요', detail: '이번 달 배달음식 지출이 늘었어요. 집밥 횟수를 늘리면 남은 예산을 여유 있게 유지할 수 있어요.' },
        { icon: 'chart',  title: '지출 패턴 점검', detail: '주말 지출이 평일보다 높은 편이에요. 주말 소비 계획을 미리 세워두면 초과를 막을 수 있어요.' },
        { icon: 'adjust', title: '마지막 일주일 전략', detail: '남은 예산을 7일로 나눠 일일 한도를 정해보세요. 작은 목표가 예산 관리를 쉽게 만들어줘요.' },
      ],
    },
    2: {
      status: 'good',
      summary: '교통비 예산을 훌륭하게 관리하고 있어요! 현재 사용률 57%로 여유가 있어요.',
      tips: [
        { icon: 'chart',  title: '이번 달 교통비 우수', detail: '지난달 대비 교통비가 안정적으로 유지되고 있어요. 현재 패턴을 그대로 유지해보세요.' },
        { icon: 'adjust', title: '남은 예산 활용 팁', detail: '남은 교통 예산으로 카풀이나 자전거 이용을 더 늘리면 다음 달 예산을 더 줄일 수도 있어요.' },
        { icon: 'food',   title: '대중교통 최적화', detail: '정기권이나 교통카드 할인 혜택을 활용하면 매달 교통비를 10~15% 절약할 수 있어요.' },
      ],
    },
  }
  localStorage.setItem('moa_demo_budget_insights', JSON.stringify(budgetInsights))

  // ── AI 소비 분석 샘플 ─────────────────────────────
  const aiFeedback = {
    score: 72,
    rating: 'warning',
    summary: '이번 달 식비 지출이 지난달보다 18% 증가했어요. 배달음식 횟수를 줄이면 절약에 도움이 돼요.',
    cuts: [
      { category: '식비', save: 50000, tip: '배달음식을 주 2회로 줄이면 이번 달 약 5만원을 절약할 수 있어요.' },
      { category: '쇼핑', save: 30000, tip: '충동 구매보다 위시리스트를 활용해 계획적으로 구매해보세요.' },
    ],
    unusual: [
      '배달음식 지출이 이번 달 2회로, 지난달 대비 2배 증가했어요.',
    ],
    saving_goal: 80000,
    message: '조금만 더 노력하면 저축 목표를 달성할 수 있어요! 화이팅 💪',
  }
  localStorage.setItem('moa_demo_ai_feedback', JSON.stringify(aiFeedback))

  // ── AI 공과금 분석 샘플 ───────────────────────────
  const utilityAIDemo = {
    items: [
      { type: '전기', status: 'up',   comment: '지난달보다 4,000원 증가했어요. 초여름 에어컨 사용이 늘어난 것 같아요.' },
      { type: '수도', status: 'same', comment: '지난달과 비슷한 수준으로 안정적으로 유지되고 있어요.' },
      { type: '가스', status: 'down', comment: '날씨가 따뜻해지면서 지난달보다 3,000원 줄었어요.' },
    ],
    overall: '전반적으로 공과금 지출이 안정적이에요. 여름철 전기요금 관리에 집중해보세요.',
    tip: '에어컨 설정 온도를 1°C 올리면 전기요금을 약 7% 절약할 수 있어요!',
  }
  localStorage.setItem('moa_demo_utility_ai', JSON.stringify(utilityAIDemo))

  // ── 데모 모드 플래그 ──────────────────────────────
  localStorage.setItem('moa_demo_mode', 'true')
  localStorage.setItem('moa_logged_in', 'true')
  localStorage.setItem('moa_nickname', '모아 moa')
}
