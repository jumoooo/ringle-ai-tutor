import type { PropsWithChildren, ReactNode } from "react"
import { NavLink } from "react-router-dom"
import UserDropdown from "@/components/UserDropdown"

interface LayoutProps extends PropsWithChildren {
  title?: string
  description?: ReactNode
  actions?: ReactNode
}

const shellStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, var(--color-surface-subtle) 0%, var(--color-surface) 100%)"
} satisfies React.CSSProperties

const containerStyle = {
  width: "min(1120px, calc(100% - var(--space-24) * 2))",
  margin: "0 auto",
  padding: "var(--space-24) 0 calc(var(--space-24) * 2)"
} satisfies React.CSSProperties

const headerStyle = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  backdropFilter: "blur(14px)",
  backgroundColor: "color-mix(in srgb, var(--color-surface) 84%, transparent)",
  borderBottom: "1px solid var(--color-border)"
} satisfies React.CSSProperties

const navLinkBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "0 var(--space-16)",
  borderRadius: "var(--radius-chip)",
  textDecoration: "none",
  fontSize: "var(--font-size-base)",
  fontWeight: "var(--font-weight-semibold)",
  color: "var(--color-text-secondary)"
} satisfies React.CSSProperties

const activeNavLinkStyle = {
  color: "var(--color-text-on-primary)",
  backgroundColor: "var(--color-primary)",
  boxShadow: "var(--shadow-mode-tab)"
} satisfies React.CSSProperties

function NavigationLink({
  to,
  label
}: {
  to: string
  label: string
}) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...navLinkBaseStyle,
        ...(isActive ? activeNavLinkStyle : null)
      })}
    >
      {label}
    </NavLink>
  )
}

export default function Layout({
  title,
  description,
  actions,
  children
}: LayoutProps) {
  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div
          style={{
            ...containerStyle,
            display: "flex",
            alignItems: "center",
            gap: "var(--space-16)",
            padding: "var(--space-16) 0"
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
                marginBottom: "var(--space-4)"
              }}
            >
              Ringle AI Tutor
            </div>
            <div
              style={{
                fontSize: "var(--font-size-3xl)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-primary)"
              }}
            >
              Speak Better, One Turn at a Time
            </div>
          </div>

          <nav
            aria-label="주요 메뉴"
            style={{
              display: "flex",
              gap: "var(--space-8)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-chip)",
              backgroundColor: "var(--color-surface-subtle)"
            }}
          >
            <NavigationLink to="/" label="홈" />
            <NavigationLink to="/chat" label="대화" />
            <NavigationLink to="/learn" label="학습" />
            <NavigationLink to="/admin" label="어드민" />
          </nav>

          <UserDropdown />
        </div>
      </header>

      <main style={containerStyle}>
        {(title || description || actions) && (
          <section
            style={{
              display: "grid",
              gap: "var(--space-12)",
              marginBottom: "var(--space-24)",
              paddingTop: "var(--space-24)"
            }}
          >
            {title ? (
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(var(--font-size-4xl), 2vw, 32px)",
                  lineHeight: "var(--line-height-tight)",
                  color: "var(--color-text-primary)"
                }}
              >
                {title}
              </h1>
            ) : null}
            {description ? (
              <div
                style={{
                  maxWidth: "720px",
                  color: "var(--color-text-secondary)"
                }}
              >
                {description}
              </div>
            ) : null}
            {actions ? <div>{actions}</div> : null}
          </section>
        )}

        {children}
      </main>
    </div>
  )
}
