export function injectDemoData() {
  // ── 카드 ──────────────────────────────────────────
  const cards = [
    { id: 1, cardType: '체크', name: '신한 체크카드', limit: 0, cardNumber: '1234', expiry: '26/08', linkedAccount: '신한은행', billingDay: '', creditTracking: '', color: '#3182F6' },
    { id: 2, cardType: '신용', name: 'KB국민 신용카드', limit: 500000, cardNumber: '5678', expiry: '27/03', linkedAccount: '', billingDay: '15', creditTracking: '', color: '#FFB300' },
    { id: 3, cardType: '신용', name: '삼성 신용카드', limit: 1000000, cardNumber: '9012', expiry: '26/11', linkedAccount: '', billingDay: '10', creditTracking: '', color: '#1B2B4B' },
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

  // ── 대출 ──────────────────────────────────────────
  const loans = [
    {
      id: 1, name: '전세자금대출', principal: 120000000, remainingPrincipal: 98000000,
      startDate: '2023-04-01', rate: 3.5, rateType: 'simple',
      monthlyPayment: 450000, paymentDay: 25, maturityDate: '2028-04-01',
      repayments: [
        { date: '2024-01-25', daysElapsed: 300, amount: 450000, cumulativeAmount: 450000 },
        { date: '2024-04-25', daysElapsed: 390, amount: 450000, cumulativeAmount: 900000 },
        { date: '2024-07-25', daysElapsed: 481, amount: 450000, cumulativeAmount: 1350000 },
        { date: '2024-10-25', daysElapsed: 573, amount: 450000, cumulativeAmount: 1800000 },
        { date: '2025-01-25', daysElapsed: 665, amount: 450000, cumulativeAmount: 2250000 },
        { date: '2025-04-25', daysElapsed: 754, amount: 450000, cumulativeAmount: 2700000 },
      ],
    },
    {
      id: 2, name: '자동차 할부', principal: 18000000, remainingPrincipal: 12000000,
      startDate: '2024-01-15', rate: 5.2, rateType: 'simple',
      monthlyPayment: 280000, paymentDay: 10, maturityDate: '2026-12-15',
      repayments: [
        { date: '2024-02-10', daysElapsed: 26,  amount: 280000, cumulativeAmount: 280000 },
        { date: '2024-03-10', daysElapsed: 55,  amount: 280000, cumulativeAmount: 560000 },
        { date: '2024-06-10', daysElapsed: 147, amount: 280000, cumulativeAmount: 840000 },
        { date: '2024-09-10', daysElapsed: 239, amount: 280000, cumulativeAmount: 1120000 },
        { date: '2025-01-10', daysElapsed: 360, amount: 280000, cumulativeAmount: 1400000 },
        { date: '2025-06-10', daysElapsed: 511, amount: 280000, cumulativeAmount: 1680000 },
      ],
    },
  ]
  localStorage.setItem('moa_loans', JSON.stringify(loans))

  // ── 거래 내역 헬퍼 ─────────────────────────────────
  const tx = (id, date, type, title, amount, category, payment, memo = '', time = '12:00') => ({
    id: String(id), uid: 'demo', month: date.slice(0, 7),
    type, title, amount, category, payment, date, time,
    memo, createdAt: new Date().toISOString(), cardBilling: false, isLoan: false,
  })

  // ── 6월 거래 내역 (2026-06-01 ~ 06-22) ───────────────
  const jun = [
    tx(101, '2026-06-01', 'income',  '6월 월급',          3200000, '급여',        '신한은행',         '', '09:00'),
    tx(102, '2026-06-01', 'expense', '스타벅스',              6500, '식비',        '신한 체크카드',    '', '08:32'),
    tx(103, '2026-06-02', 'expense', '이마트',               87300, '식비',        '신한 체크카드',    '', '18:45'),
    tx(104, '2026-06-02', 'expense', '지하철',                1500, '교통',        '신한 체크카드',    '', '08:10'),
    tx(105, '2026-06-03', 'expense', '올리브영',             43000, '생활',        'KB국민 신용카드',  '', '14:20'),
    tx(106, '2026-06-03', 'expense', '넷플릭스',             17000, '구독',        'KB국민 신용카드',  '', '00:05'),
    tx(107, '2026-06-04', 'expense', '점심식사',             12000, '식비',        '현금',             '', '12:30'),
    tx(108, '2026-06-05', 'expense', '주유',                 65000, '교통',        'KB국민 신용카드',  '', '17:55'),
    tx(109, '2026-06-06', 'expense', '카페라떼',              8500, '식비',        '신한 체크카드',    '', '09:15'),
    tx(110, '2026-06-07', 'expense', '의류 구매',            89000, '쇼핑',        '삼성 신용카드',    '', '15:40'),
    tx(111, '2026-06-08', 'expense', '병원비',               15000, '의료/건강',   '현금',             '', '11:00'),
    tx(112, '2026-06-09', 'expense', '마트 장보기',          56800, '식비',        '신한 체크카드',    '', '19:20'),
    tx(113, '2026-06-10', 'income',  '프리랜서 수입',       300000, '부수입',      '카카오뱅크',       '', '10:00'),
    tx(114, '2026-06-10', 'expense', '택시',                 13500, '교통',        '신한 체크카드',    '', '23:40'),
    tx(115, '2026-06-11', 'expense', '헬스장',               80000, '스포츠/레저', 'KB국민 신용카드',  '', '07:30'),
    tx(116, '2026-06-12', 'expense', '편의점',                4300, '식비',        '신한 체크카드',    '', '22:10'),
    tx(117, '2026-06-13', 'expense', '배달음식',             32000, '식비',        '신한 체크카드',    '', '19:05'),
    tx(118, '2026-06-14', 'expense', '약국',                  8900, '의료/건강',   '현금',             '', '13:50'),
    tx(119, '2026-06-15', 'expense', '아메리카노',             7000, '식비',        '신한 체크카드',    '', '08:55'),
    tx(120, '2026-06-16', 'expense', '온라인 쇼핑',          56000, '쇼핑',        '삼성 신용카드',    '', '02:30'),
    tx(121, '2026-06-17', 'expense', '외식 (삼겹살)',         45000, '식비',        'KB국민 신용카드',  '', '18:30'),
    tx(122, '2026-06-18', 'expense', '지하철',                1500, '교통',        '신한 체크카드',    '', '07:58'),
    tx(123, '2026-06-19', 'expense', '마트',                 34200, '식비',        '신한 체크카드',    '', '20:15'),
    tx(124, '2026-06-20', 'expense', '미용실',               30000, '생활',        '현금',             '', '11:30'),
    tx(125, '2026-06-21', 'expense', '영화 관람',             15000, '문화/여가',   'KB국민 신용카드',  '', '16:00'),
    tx(126, '2026-06-22', 'expense', '점심 (김치찌개)',       11000, '식비',        '신한 체크카드',    '', '12:05'),
    tx(127, '2026-06-22', 'expense', '배달음식',             28000, '식비',        '신한 체크카드',    '', '20:45'),
    tx(128, '2026-06-22', 'expense', '전기요금',             33000, '공과금',      '신한 체크카드',    '6월분', '09:30'),
    tx(129, '2026-06-22', 'expense', '수도요금',             15000, '공과금',      '신한 체크카드',    '6월분', '09:31'),
    tx(130, '2026-06-22', 'expense', '가스요금',             12000, '공과금',      '신한 체크카드',    '6월분', '09:32'),
  ]
  localStorage.setItem('moa_txns_2026-06', JSON.stringify(jun))

  // ── 이전 달 거래 내역 (분석용 샘플) ──────────────────
  const prevMonths = [
    { m: '2026-05', expenses: [
      tx(201,'2026-05-01','income', '5월 월급',    3200000,'급여',        '신한은행',        '', '09:00'),
      tx(214,'2026-05-20','income', '중고거래 판매', 45000,'부수입',      '카카오뱅크',      '', '14:30'),
      tx(202,'2026-05-02','expense','이마트',        92000,'식비',        '신한 체크카드',   '', '18:50'),
      tx(203,'2026-05-05','expense','주유',          62000,'교통',        'KB국민 신용카드', '', '17:20'),
      tx(204,'2026-05-08','expense','넷플릭스',      17000,'구독',        'KB국민 신용카드', '', '00:05'),
      tx(205,'2026-05-10','expense','헬스장',        80000,'스포츠/레저', 'KB국민 신용카드', '', '07:30'),
      tx(206,'2026-05-12','expense','카페',           9000,'식비',        '신한 체크카드',   '', '09:10'),
      tx(207,'2026-05-15','expense','외식',          38000,'식비',        'KB국민 신용카드', '', '19:00'),
      tx(208,'2026-05-18','expense','의류',          72000,'쇼핑',        '삼성 신용카드',   '', '15:30'),
      tx(209,'2026-05-20','expense','마트',          48000,'식비',        '신한 체크카드',   '', '20:10'),
      tx(210,'2026-05-22','expense','병원비',        12000,'의료/건강',   '현금',            '', '11:20'),
      tx(211,'2026-05-25','expense','전기요금',      29000,'공과금',      '신한 체크카드',   '5월분', '09:30'),
      tx(212,'2026-05-25','expense','수도요금',      13000,'공과금',      '신한 체크카드',   '5월분', '09:31'),
      tx(213,'2026-05-25','expense','가스요금',      15000,'공과금',      '신한 체크카드',   '5월분', '09:32'),
    ]},
    { m: '2026-04', expenses: [
      tx(311,'2026-04-01','income', '4월 월급',    3200000,'급여',        '신한은행',        '', '09:00'),
      tx(312,'2026-04-15','income', '환급금',       87000,'부수입',      '카카오뱅크',      '', '10:30'),
      tx(301,'2026-04-03','expense','마트',         78000,'식비',        '신한 체크카드',   '', '19:00'),
      tx(302,'2026-04-07','expense','넷플릭스',     17000,'구독',        'KB국민 신용카드', '', '00:05'),
      tx(303,'2026-04-10','expense','주유',         58000,'교통',        'KB국민 신용카드', '', '17:40'),
      tx(304,'2026-04-13','expense','외식',         42000,'식비',        'KB국민 신용카드', '', '18:45'),
      tx(305,'2026-04-15','expense','헬스장',       80000,'스포츠/레저', 'KB국민 신용카드', '', '07:30'),
      tx(306,'2026-04-18','expense','쇼핑',         95000,'쇼핑',        '삼성 신용카드',   '', '14:00'),
      tx(307,'2026-04-21','expense','카페',          7500,'식비',        '신한 체크카드',   '', '08:40'),
      tx(308,'2026-04-25','expense','전기요금',     32000,'공과금',      '신한 체크카드',   '4월분', '09:30'),
      tx(309,'2026-04-25','expense','수도요금',     14000,'공과금',      '신한 체크카드',   '4월분', '09:31'),
      tx(310,'2026-04-25','expense','가스요금',     32000,'공과금',      '신한 체크카드',   '4월분', '09:32'),
    ]},
    { m: '2026-03', expenses: [
      tx(410,'2026-03-01','income', '3월 월급',    3200000,'급여',        '신한은행',        '', '09:00'),
      tx(411,'2026-03-10','income', '프리랜서 수입',150000,'부수입',      '카카오뱅크',      '', '11:00'),
      tx(401,'2026-03-04','expense','마트',         85000,'식비',        '신한 체크카드',   '', '18:30'),
      tx(402,'2026-03-08','expense','넷플릭스',     17000,'구독',        'KB국민 신용카드', '', '00:05'),
      tx(403,'2026-03-12','expense','주유',         71000,'교통',        'KB국민 신용카드', '', '17:10'),
      tx(404,'2026-03-16','expense','외식',         55000,'식비',        'KB국민 신용카드', '', '19:20'),
      tx(405,'2026-03-20','expense','헬스장',       80000,'스포츠/레저', 'KB국민 신용카드', '', '07:30'),
      tx(406,'2026-03-23','expense','의류',        110000,'쇼핑',        '삼성 신용카드',   '', '15:00'),
      tx(407,'2026-03-25','expense','전기요금',     38000,'공과금',      '신한 체크카드',   '3월분', '09:30'),
      tx(408,'2026-03-25','expense','수도요금',     16000,'공과금',      '신한 체크카드',   '3월분', '09:31'),
      tx(409,'2026-03-25','expense','가스요금',     54000,'공과금',      '신한 체크카드',   '3월분', '09:32'),
    ]},
    { m: '2026-02', expenses: [
      tx(509,'2026-02-01','income', '2월 월급',    3200000,'급여',        '신한은행',        '', '09:00'),
      tx(501,'2026-02-05','expense','마트',         91000,'식비',        '신한 체크카드',   '', '19:50'),
      tx(502,'2026-02-08','expense','넷플릭스',     17000,'구독',        'KB국민 신용카드', '', '00:05'),
      tx(503,'2026-02-12','expense','주유',         68000,'교통',        'KB국민 신용카드', '', '17:30'),
      tx(504,'2026-02-14','expense','외식 (발렌타인)',75000,'식비',      'KB국민 신용카드', '', '19:00'),
      tx(505,'2026-02-18','expense','헬스장',       80000,'스포츠/레저', 'KB국민 신용카드', '', '07:30'),
      tx(506,'2026-02-25','expense','전기요금',     52000,'공과금',      '신한 체크카드',   '2월분', '09:30'),
      tx(507,'2026-02-25','expense','수도요금',     15000,'공과금',      '신한 체크카드',   '2월분', '09:31'),
      tx(508,'2026-02-25','expense','가스요금',     76000,'공과금',      '신한 체크카드',   '2월분', '09:32'),
    ]},
    { m: '2026-01', expenses: [
      tx(610,'2026-01-01','income', '1월 월급',    3200000,'급여',        '신한은행',        '', '09:00'),
      tx(611,'2026-01-22','income', '상여금',      500000,'부수입',       '신한은행',        '', '10:00'),
      tx(601,'2026-01-05','expense','마트',        102000,'식비',        '신한 체크카드',   '', '19:30'),
      tx(602,'2026-01-08','expense','넷플릭스',     17000,'구독',        'KB국민 신용카드', '', '00:05'),
      tx(603,'2026-01-10','expense','주유',         74000,'교통',        'KB국민 신용카드', '', '17:00'),
      tx(604,'2026-01-14','expense','외식',         48000,'식비',        'KB국민 신용카드', '', '18:30'),
      tx(605,'2026-01-18','expense','헬스장',       80000,'스포츠/레저', 'KB국민 신용카드', '', '07:30'),
      tx(606,'2026-01-20','expense','의류',         88000,'쇼핑',        '삼성 신용카드',   '', '14:20'),
      tx(607,'2026-01-25','expense','전기요금',     45000,'공과금',      '신한 체크카드',   '1월분', '09:30'),
      tx(608,'2026-01-25','expense','수도요금',     18000,'공과금',      '신한 체크카드',   '1월분', '09:31'),
      tx(609,'2026-01-25','expense','가스요금',     89000,'공과금',      '신한 체크카드',   '1월분', '09:32'),
    ]},
  ]
  prevMonths.forEach(({ m, expenses }) => {
    localStorage.setItem(`moa_txns_${m}`, JSON.stringify(expenses))
  })

  // ── 공과금 (분석 탭용) ────────────────────────────
  const utilities = [
    { type: '전기세', year: 2026, month: 1, amount: 45000, day: 25 },
    { type: '전기세', year: 2026, month: 2, amount: 52000, day: 25 },
    { type: '전기세', year: 2026, month: 3, amount: 38000, day: 25 },
    { type: '전기세', year: 2026, month: 4, amount: 32000, day: 25 },
    { type: '전기세', year: 2026, month: 5, amount: 29000, day: 25 },
    { type: '전기세', year: 2026, month: 6, amount: 33000, day: 25 },
    { type: '수도세', year: 2026, month: 1, amount: 18000, day: 25 },
    { type: '수도세', year: 2026, month: 2, amount: 15000, day: 25 },
    { type: '수도세', year: 2026, month: 3, amount: 16000, day: 25 },
    { type: '수도세', year: 2026, month: 4, amount: 14000, day: 25 },
    { type: '수도세', year: 2026, month: 5, amount: 13000, day: 25 },
    { type: '수도세', year: 2026, month: 6, amount: 15000, day: 25 },
    { type: '가스비', year: 2026, month: 1, amount: 89000, day: 25 },
    { type: '가스비', year: 2026, month: 2, amount: 76000, day: 25 },
    { type: '가스비', year: 2026, month: 3, amount: 54000, day: 25 },
    { type: '가스비', year: 2026, month: 4, amount: 32000, day: 25 },
    { type: '가스비', year: 2026, month: 5, amount: 15000, day: 25 },
    { type: '가스비', year: 2026, month: 6, amount: 12000, day: 25 },
    { type: '관리비', year: 2026, month: 1, amount: 95000, day: 20 },
    { type: '관리비', year: 2026, month: 2, amount: 98000, day: 20 },
    { type: '관리비', year: 2026, month: 3, amount: 92000, day: 20 },
    { type: '관리비', year: 2026, month: 4, amount: 88000, day: 20 },
    { type: '관리비', year: 2026, month: 5, amount: 91000, day: 20 },
    { type: '관리비', year: 2026, month: 6, amount: 94000, day: 20 },
  ]
  localStorage.setItem('moa_utilities', JSON.stringify(utilities))

  // ── 고정지출 ──────────────────────────────────────
  const fixedExpenses = [
    { id: 1,  title: '월세',             amount: 550000, dueDate: '2026-06-05', category: '주거',        payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 2,  title: '넷플릭스',         amount: 17000,  dueDate: '2026-06-03', category: '구독',        payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 3,  title: '헬스장',           amount: 80000,  dueDate: '2026-06-11', category: '스포츠/레저', payment: 'KB국민 신용카드', autoRegister: false, doneMonths: [], autoRegisteredMonths: [] },
    { id: 4,  title: '전세자금대출 이자', amount: 285000, dueDate: '2026-06-25', category: '금융',       payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 5,  title: '자동차 할부',       amount: 280000, dueDate: '2026-06-10', category: '교통',       payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 6,  title: '유튜브 프리미엄',   amount: 14900,  dueDate: '2026-06-18', category: '구독',       payment: 'KB국민 신용카드', autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
    { id: 7,  title: '실손보험',          amount: 32000,  dueDate: '2026-06-22', category: '의료/건강',  payment: '신한은행',        autoRegister: true,  doneMonths: [], autoRegisteredMonths: [] },
  ]
  localStorage.setItem('moa_fixed_expenses', JSON.stringify(fixedExpenses))

  // ── 예산 ──────────────────────────────────────────
  const budgets = [
    { id: 1, label: '6월 생활비', startDate: '2026-06-01', endDate: '2026-06-30', amount: 800000, categories: ['식비', '생활'] },
    { id: 2, label: '6월 교통비', startDate: '2026-06-01', endDate: '2026-06-30', amount: 150000, categories: ['교통'] },
  ]
  localStorage.setItem('moa_budgets', JSON.stringify(budgets))

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
