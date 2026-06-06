import '@testing-library/jest-dom'

beforeEach(() => {
  try {
    localStorage.clear()
  } catch {
    // not available in Node environment
  }
})
