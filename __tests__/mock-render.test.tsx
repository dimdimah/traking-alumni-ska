import { render } from "@testing-library/react"
import React from "react"
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

const mockDocument = jest.fn(({ children }: any) => React.createElement('div', { 'data-testid': 'pdf-document' }, children))
const mockPage = jest.fn(({ children, style }: any) => React.createElement('div', { 'data-testid': 'pdf-page' }, children))
const mockText = jest.fn(({ children, style }: any) => React.createElement('span', { 'data-testid': 'pdf-text' }, children))
const mockView = jest.fn(({ children, style }: any) => React.createElement('div', { 'data-testid': 'pdf-view' }, children))
const mockStyleSheet = { create: jest.fn((styles: any) => styles) }

jest.mock("@react-pdf/renderer", () => ({
  Document: mockDocument,
  Page: mockPage,
  Text: mockText,
  View: mockView,
  StyleSheet: mockStyleSheet,
  Font: {},
}))

const CvTemplate = ({ data, lang }: any) => {
  return React.createElement(mockDocument, { title: "test" },
    React.createElement(mockPage, { size: "A4" },
      React.createElement(mockView, null,
        React.createElement(mockText, null, "Hello"),
        React.createElement(mockText, null, "World")
      )
    )
  )
}

describe("Mock render test", () => {
  beforeEach(() => {
    mockDocument.mockClear()
    mockPage.mockClear()
    mockText.mockClear()
    mockView.mockClear()
    mockStyleSheet.create.mockClear()
  })

  it("should render and call mockText", () => {
    const { container } = render(React.createElement(CvTemplate, { data: {}, lang: "id" }))
    console.log("container:", container.innerHTML)
    console.log("mockText calls:", mockText.mock.calls.length)
    expect(mockText).toHaveBeenCalledTimes(2)
  })
})
