import { float32ToWavBlob } from "@/utils/audio"

describe("audio utils", () => {
  it("float32ToWavBlob이 wav blob을 만들어요", () => {
    const blob = float32ToWavBlob(new Float32Array([0, 0.5, -0.5]))

    expect(blob.type).toBe("audio/wav")
    expect(blob.size).toBeGreaterThan(44)
  })

  it("기본 샘플레이트 없이도 동작해요", () => {
    const blob = float32ToWavBlob(new Float32Array([0.1, 0.2]))

    expect(blob).toBeInstanceOf(Blob)
  })
})
