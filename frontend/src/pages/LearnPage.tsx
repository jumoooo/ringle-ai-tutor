import Layout from "@/components/Layout"

const learningTipCards = [
  {
    title: "짧게 자주 말해요",
    description: "하루 10분이라도 꾸준히 소리 내어 말하면 말문이 훨씬 빨리 트여요."
  },
  {
    title: "틀린 표현을 바로 고쳐요",
    description: "완벽하게 말하려고 멈추기보다 먼저 말하고, 틀린 부분만 바로 다듬는 편이 더 효과적이에요."
  },
  {
    title: "내 표현으로 다시 말해요",
    description: "배운 문장을 그대로 외우기보다 오늘 있었던 일을 같은 패턴으로 바꿔 말하면 오래 기억돼요."
  }
] as const

export default function LearnPage() {
  return (
    <Layout
      title="학습 가이드"
      description="지금 바로 실천할 수 있는 영어 학습 팁 3가지를 정리했어요."
    >
      <section
        aria-label="학습 팁"
        style={{
          display: "grid",
          gap: "var(--space-16)"
        }}
      >
        {learningTipCards.map((learningTip) => (
          <article
            key={learningTip.title}
            style={{
              padding: "var(--space-24)",
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
              display: "grid",
              gap: "var(--space-8)"
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "var(--font-size-xl)",
                color: "var(--color-text-primary)"
              }}
            >
              {learningTip.title}
            </h2>
            <p
              style={{
                margin: 0,
                color: "var(--color-text-secondary)",
                lineHeight: "var(--line-height-relaxed)"
              }}
            >
              {learningTip.description}
            </p>
          </article>
        ))}
      </section>
    </Layout>
  )
}
