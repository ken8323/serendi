/**
 * @jest-environment node
 */
import { POST } from '@/app/api/gacha/route'

const mockSheetJson = JSON.stringify({
  theme: '量子コンピュータ',
  summary: '量子の重ね合わせを使って計算する次世代コンピュータ',
  points: ['point1', 'point2', 'point3'],
  next_keywords: ['keyword1', 'keyword2'],
})

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: mockSheetJson }],
      }),
    },
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
  it('returns a sheet with correct shape', async () => {
    const res = await POST(makeRequest({ occupation: 'エンジニア', domain: 'Web開発' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sheet).toMatchObject({
      theme: '量子コンピュータ',
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
})
