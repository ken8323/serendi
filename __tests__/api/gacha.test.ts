/**
 * @jest-environment node
 */
import { POST } from '@/app/api/gacha/route'

const mockSheetJson = JSON.stringify({
  theme: '量子コンピュータ',
  category: '最新テクノロジー',
  summary: '量子の重ね合わせを使って計算する次世代コンピュータ',
  points: ['point1', 'point2', 'point3'],
  next_keywords: ['keyword1', 'keyword2'],
})

const messagesCreate = jest.fn().mockResolvedValue({
  content: [{ type: 'text', text: mockSheetJson }],
})

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: messagesCreate },
  })),
}))

function makeRequest(body: object) {
  return new Request('http://localhost/api/gacha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/gacha', () => {
  beforeEach(() => {
    messagesCreate.mockClear()
  })

  it('returns a sheet with correct shape including category', async () => {
    const res = await POST(makeRequest({ occupation: 'エンジニア', domain: 'Web開発' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sheet).toMatchObject({
      theme: '量子コンピュータ',
      category: '最新テクノロジー',
      summary: expect.any(String),
      points: expect.arrayContaining([expect.any(String)]),
      next_keywords: expect.arrayContaining([expect.any(String)]),
      id: expect.any(String),
      createdAt: expect.any(Number),
    })
  })

  it('returns 400 when occupation or domain is missing', async () => {
    const res = await POST(makeRequest({ occupation: '' }))
    expect(res.status).toBe(400)
  })

  it('injects preferences into the user message when provided', async () => {
    await POST(
      makeRequest({
        occupation: 'エンジニア',
        domain: 'Web開発',
        preferences: {
          liked_categories: ['辺境文化', '自然科学'],
          disliked_categories: ['歴史'],
        },
      })
    )
    const call = messagesCreate.mock.calls[0][0]
    const userContent = call.messages[0].content as string
    expect(userContent).toContain('辺境文化')
    expect(userContent).toContain('自然科学')
    expect(userContent).toContain('歴史')
    expect(userContent).toContain('傾向')
  })

  it('omits preferences block when preferences are empty', async () => {
    await POST(
      makeRequest({
        occupation: 'エンジニア',
        domain: 'Web開発',
        preferences: { liked_categories: [], disliked_categories: [] },
      })
    )
    const call = messagesCreate.mock.calls[0][0]
    const userContent = call.messages[0].content as string
    expect(userContent).not.toContain('傾向')
  })

  it('falls back to category="unknown" if AI omits it', async () => {
    messagesCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            theme: 'X',
            summary: 'S',
            points: ['a', 'b', 'c'],
            next_keywords: ['k'],
          }),
        },
      ],
    })
    const res = await POST(makeRequest({ occupation: 'E', domain: 'W' }))
    const data = await res.json()
    expect(data.sheet.category).toBe('unknown')
  })
})
