import AiConsumptionReport from './AiConsumptionReport'

// AI 공과금 분석 카드 본문. 'AI 소비 분석'과 디자인·구성이 같아야 하므로 레이아웃은 AiConsumptionReport를
// 그대로 쓰고, 공과금 문구(variant='utility')와 공과금 수치만 넘긴다.
// - currentTotal/prevTotal: 이번 달·지난달 공과금 합계 (분석 전 미리보기 수치)
// - utilitySpend: 항목별 이번 달 금액 (절감액 대비 비율 막대에 사용)
// - itemDiffs: 항목별 전월 대비 증감액 (전월 데이터가 없으면 null)
export default function AiUtilityReport({ currentTotal = 0, prevTotal = 0, utilitySpend = {}, ...rest }) {
  return (
    <AiConsumptionReport
      variant="utility"
      totalExpense={currentTotal} lastTotalExpense={prevTotal} categorySpend={utilitySpend}
      {...rest}
    />
  )
}
