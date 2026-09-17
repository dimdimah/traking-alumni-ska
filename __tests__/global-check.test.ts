describe("Global check", () => {
  it("should have Response and Request", () => {
    console.log("Response:", typeof Response)
    console.log("Request:", typeof Request)
    expect(typeof Response).toBe("function")
    expect(typeof Request).toBe("function")
  })
})
