import React, { useEffect, useRef, useState } from "react"
import type { CardData } from "@/types/payment"

interface PaymentModalProps {
  open: boolean
  planName: string
  onConfirm: (cardData: CardData) => void
  onClose: () => void
  isPending: boolean
}

const DOTS = ['.', '..', '...', '..', '.'] as const

const inputStyle: React.CSSProperties = {
  padding: "var(--space-12) var(--space-8)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-card)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-text-primary)",
  fontSize: "var(--font-size-base)",
  boxSizing: "border-box",
  textAlign: "center",
  width: "100%"
}

const labelStyle: React.CSSProperties = {
  fontSize: "var(--font-size-sm)",
  fontWeight: "var(--font-weight-medium)",
  color: "var(--color-text-secondary)"
}

export default function PaymentModal({
  open,
  planName,
  onConfirm,
  onClose,
  isPending
}: PaymentModalProps) {
  const [card, setCard] = useState(["", "", "", ""])
  const [expiryMM, setExpiryMM] = useState("")
  const [expiryYY, setExpiryYY] = useState("")
  const [cvc, setCvc] = useState("")
  const [dotIdx, setDotIdx] = useState(0)

  const cardRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const expiryMMRef = useRef<HTMLInputElement>(null)
  const expiryYYRef = useRef<HTMLInputElement>(null)
  const cvcRef = useRef<HTMLInputElement>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  // open 변경 시 입력값 초기화
  useEffect(() => {
    if (!open) {
      setCard(["", "", "", ""])
      setExpiryMM("")
      setExpiryYY("")
      setCvc("")
    }
  }, [open])

  // 결제중 점 애니메이션
  useEffect(() => {
    if (!isPending) {
      setDotIdx(0)
      return
    }
    const id = setInterval(() => {
      setDotIdx(prev => (prev + 1) % DOTS.length)
    }, 400)
    return () => clearInterval(id)
  }, [isPending])

  // ESC 키
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  const handleCardChange = (idx: number, val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4)
    const next = [...card]
    next[idx] = digits
    setCard(next)
    if (digits.length === 4) {
      if (idx < 3) cardRefs[idx + 1].current?.focus()
      else expiryMMRef.current?.focus()
    }
  }

  const handleCardKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && card[idx] === "" && idx > 0) {
      cardRefs[idx - 1].current?.focus()
    }
  }

  const handleMMChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 2)
    setExpiryMM(digits)
    if (digits.length === 2) expiryYYRef.current?.focus()
  }

  const handleYYChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 2)
    setExpiryYY(digits)
    if (digits.length === 2) cvcRef.current?.focus()
  }

  const handleYYKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && expiryYY === "") expiryMMRef.current?.focus()
  }

  const handleCvcChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 3)
    setCvc(digits)
    if (digits.length === 3) confirmBtnRef.current?.focus()
  }

  const handleConfirm = () => {
    onConfirm({
      card_number: card.join(""),
      expiry: `${expiryMM}/${expiryYY}`,
      cvc,
    })
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="결제 정보 입력"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-16)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
          padding: "var(--space-24)",
          width: "100%",
          maxWidth: "420px",
          display: "grid",
          gap: "var(--space-20)"
        }}
      >
        {/* 헤더 */}
        <div>
          <h2
            style={{
              margin: "0 0 var(--space-4)",
              fontSize: "var(--font-size-4xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text-primary)"
            }}
          >
            결제 정보 입력
          </h2>
          <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            {planName} 플랜 구매
          </p>
        </div>

        {/* 입력 영역 */}
        <div style={{ display: "grid", gap: "var(--space-16)" }}>

          {/* 카드번호 */}
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <span style={labelStyle}>카드번호</span>
            <div style={{ display: "flex", gap: "var(--space-8)", alignItems: "center" }}>
              {card.map((val, idx) => (
                <React.Fragment key={idx}>
                  <input
                    ref={cardRefs[idx]}
                    aria-label={`카드번호 ${idx + 1}번째 4자리`}
                    inputMode="numeric"
                    maxLength={4}
                    value={val}
                    onChange={(e) => handleCardChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCardKeyDown(idx, e)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {idx < 3 && (
                    <span
                      aria-hidden="true"
                      style={{
                        color: "var(--color-text-secondary)",
                        fontWeight: "var(--font-weight-semibold)",
                        flexShrink: 0
                      }}
                    >
                      -
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 유효기간 + CVC */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-12)" }}>

            {/* 유효기간 */}
            <div style={{ display: "grid", gap: "var(--space-4)" }}>
              <span style={labelStyle}>유효기간</span>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <input
                  ref={expiryMMRef}
                  aria-label="유효기간 월"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  value={expiryMM}
                  onChange={(e) => handleMMChange(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontWeight: "var(--font-weight-semibold)",
                    flexShrink: 0
                  }}
                >
                  /
                </span>
                <input
                  ref={expiryYYRef}
                  aria-label="유효기간 연도"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="YY"
                  value={expiryYY}
                  onChange={(e) => handleYYChange(e.target.value)}
                  onKeyDown={handleYYKeyDown}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </div>

            {/* CVC */}
            <div style={{ display: "grid", gap: "var(--space-4)" }}>
              <span style={labelStyle}>CVC</span>
              <input
                ref={cvcRef}
                aria-label="CVC"
                inputMode="numeric"
                type="password"
                maxLength={3}
                placeholder="123"
                value={cvc}
                onChange={(e) => handleCvcChange(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: "grid", gap: "var(--space-8)" }}>
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            style={{
              minHeight: "48px",
              border: "none",
              borderRadius: "var(--radius-card)",
              backgroundColor: isPending ? "var(--color-disabled)" : "var(--color-primary)",
              color: "var(--color-text-on-primary)",
              fontSize: "var(--font-size-base)",
              fontWeight: "var(--font-weight-semibold)",
              cursor: isPending ? "not-allowed" : "pointer"
            }}
          >
            {isPending ? `결제중${DOTS[dotIdx]}` : "결제 완료"}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: "44px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-base)",
              cursor: "pointer"
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
