import { describe, it, expect } from 'vitest'
import { planAutoRegistration } from '../autoRegisterFixed'

const base = { id: 1, title: '월세', amount: 500000, dueDate: '2026-01-05', category: '주거', payment: '신한은행', autoRegister: true }
const oct2 = new Date(2026, 9, 2)   // 2026-10-02
const oct10 = new Date(2026, 9, 10) // 2026-10-10

describe('planAutoRegistration', () => {
  it('결제일이 지나면 이번 달을 등록하고 완료로 표시한다', () => {
    const { transactions, updated } = planAutoRegistration([{ ...base, autoRegisteredMonths: [], doneMonths: [] }], oct10)
    expect(transactions.map(t => t.date)).toEqual(['2026-10-05'])
    expect(updated[0].autoRegisteredMonths).toEqual(['2026-10'])
    expect(updated[0].doneMonths).toEqual(['2026-10'])
  })

  it('결제일 전이면 이번 달은 등록하지 않는다', () => {
    const { transactions } = planAutoRegistration([{ ...base, dueDate: '2026-01-15', autoRegisteredMonths: [], doneMonths: [] }], oct10)
    expect(transactions).toEqual([])
  })

  it('마지막 등록 이후 빠진 달을 채운다', () => {
    const { transactions, updated } = planAutoRegistration([{ ...base, autoRegisteredMonths: ['2026-07'], doneMonths: ['2026-07'] }], oct10)
    expect(transactions.map(t => t.month)).toEqual(['2026-08', '2026-09', '2026-10'])
    expect(updated[0].autoRegisteredMonths).toEqual(['2026-07', '2026-08', '2026-09', '2026-10'])
  })

  it('지난달은 결제일과 무관하게 채우고, 이번 달은 결제일 전이면 건너뛴다', () => {
    const { transactions } = planAutoRegistration([{ ...base, autoRegisteredMonths: ['2026-08'], doneMonths: [] }], oct2)
    expect(transactions.map(t => t.month)).toEqual(['2026-09'])
  })

  it('한 번도 등록한 적 없으면 과거 달은 채우지 않는다', () => {
    const { transactions } = planAutoRegistration([{ ...base, startMonth: '2026-01', autoRegisteredMonths: [], doneMonths: [] }], oct10)
    expect(transactions.map(t => t.month)).toEqual(['2026-10'])
  })

  it('직접 체크한 달·이미 등록한 달은 다시 등록하지 않는다', () => {
    const { transactions } = planAutoRegistration([
      { ...base, autoRegisteredMonths: ['2026-08'], doneMonths: ['2026-08', '2026-09'] },
      { ...base, id: 2, autoRegisteredMonths: ['2026-10'], doneMonths: ['2026-10'] },
    ], oct10)
    expect(transactions.map(t => `${t.fixedExpenseId}:${t.month}`)).toEqual(['1:2026-10'])
  })

  it('자동 등록이 꺼진 항목·삭제된 달은 건너뛴다', () => {
    const { transactions } = planAutoRegistration([
      { ...base, autoRegister: false, autoRegisteredMonths: [], doneMonths: [] },
      { ...base, id: 2, endMonth: '2026-10', autoRegisteredMonths: ['2026-08'], doneMonths: [] },
    ], oct10)
    expect(transactions.map(t => `${t.fixedExpenseId}:${t.month}`)).toEqual(['2:2026-09'])
  })

  it('그 달에 없는 결제일(31일)은 말일로 등록한다', () => {
    const { transactions } = planAutoRegistration([{ ...base, dueDate: '2026-01-31', autoRegisteredMonths: ['2026-08'], doneMonths: [] }], oct2)
    expect(transactions.map(t => t.date)).toEqual(['2026-09-30'])
  })

  it('달마다 바뀐 금액(버전)을 그 달 기준으로 쓴다', () => {
    const { transactions } = planAutoRegistration([{ ...base, versions: [{ from: '2026-10', amount: 600000 }], autoRegisteredMonths: ['2026-08'], doneMonths: [] }], oct10)
    expect(transactions.map(t => `${t.month}:${t.amount}`)).toEqual(['2026-09:500000', '2026-10:600000'])
  })

  it('놓친 달 채우기는 최대 12개월까지만 한다', () => {
    const { transactions } = planAutoRegistration([{ ...base, autoRegisteredMonths: ['2024-01'], doneMonths: [] }], oct10)
    expect(transactions[0].month).toBe('2025-10')
    expect(transactions).toHaveLength(13)
  })
})
