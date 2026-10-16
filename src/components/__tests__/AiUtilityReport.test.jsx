import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AiUtilityReport from '../AiUtilityReport'

const base = {
  primary: '#3182F6', primaryLight: '#E8F3FF', fmt: (n) => Number(n).toLocaleString('ko-KR'),
  onAnalyze: vi.fn(), loading: false, saved: false, raw: '',
  month: 10, currentTotal: 175200, prevTotal: 166800, styleLevel: 3, showAdvice: true, hasData: true,
}

describe('AiUtilityReport — AI 소비 분석과 같은 구성', () => {
  it('분석 전: 소비 분석과 같은 미리보기(점수·아낄 수 있는 곳·항목별 변화)를 공과금 문구로 보여준다', () => {
    render(<AiUtilityReport {...base} data={null} />)
    expect(screen.getByText('AI 공과금 분석')).toBeInTheDocument()
    expect(screen.getByText('균형형 스타일')).toBeInTheDocument()
    expect(screen.getByText('공과금 점수')).toBeInTheDocument()
    expect(screen.getByText('아낄 수 있는 곳')).toBeInTheDocument()
    expect(screen.getByText('항목별 변화')).toBeInTheDocument()
    expect(screen.getByText('✨ 이번 달 공과금 분석하기')).toBeInTheDocument()
  })

  it('분석 후: 점수·요약·조언·항목별 변화·한마디를 소비 분석과 같은 순서로 보여준다', () => {
    const data = {
      rating: 'good', score: 78, summary: '요약입니다.',
      items: [{ type: '전기세', status: 'up', comment: '전기세 코멘트입니다.' }],
      cuts: [{ category: '전기세', tip: '전기세 조언입니다.', save: 4000 }],
      saving_goal: 6000, message: '응원합니다.',
    }
    render(<AiUtilityReport {...base} data={data} itemDiffs={{ 전기세: 4000 }} utilitySpend={{ 전기세: 34000 }} />)
    expect(screen.getByText('78')).toBeInTheDocument()
    expect(screen.getByText('공과금 관리 우등생이에요')).toBeInTheDocument()
    expect(screen.getByText('요약입니다.')).toBeInTheDocument()
    expect(screen.getByText('이번 달 전기세 34,000원 중 12%')).toBeInTheDocument()
    expect(screen.getByText('전기세 코멘트입니다.')).toBeInTheDocument()
    expect(screen.getByText('▲ 4,000원')).toBeInTheDocument()
    expect(screen.getByText('응원합니다.')).toBeInTheDocument()
  })

  it('예전 형식(overall/tip) 결과도 깨지지 않고 같은 레이아웃으로 보여준다', () => {
    render(<AiUtilityReport {...base} data={{ overall: '예전 총평입니다.', tip: '예전 팁입니다.', items: [] }} />)
    expect(screen.getByText('예전 총평입니다.')).toBeInTheDocument()
    expect(screen.getByText('예전 팁입니다.')).toBeInTheDocument()
    expect(screen.queryByText('점')).not.toBeInTheDocument()
  })
})
