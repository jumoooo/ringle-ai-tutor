import Layout from "@/components/Layout"

export default function LearnPage() {
  return (
    <Layout
      title="학습 화면"
      description="베이직 멤버십 이상에서 열리는 학습 영역이에요."
    >
      <section
        style={{
          padding: "var(--space-24)",
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-card)"
        }}
      >
        준비 중이에요.
      </section>
    </Layout>
  )
}
