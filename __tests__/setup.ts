import "@testing-library/jest-dom"

if (typeof globalThis.Response === 'undefined') {
  class MockResponse {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }
    json() { return Promise.resolve(JSON.parse(this.body)) }
    text() { return Promise.resolve(this.body) }
    blob() { return Promise.resolve(new Blob([this.body])) }
  }
  globalThis.Response = MockResponse
  globalThis.Request = class MockRequest {
    constructor(input, init) {
      this.url = input
      this.method = init?.method || 'GET'
    }
  }
}

class MockIntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = '0px'
  readonly thresholds: ReadonlyArray<number> = [0]

  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  configurable: true,
  value: (cb: FrameRequestCallback) => {
    cb(performance.now())
    return 0
  },
})
