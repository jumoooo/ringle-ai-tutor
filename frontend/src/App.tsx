import { API_ENDPOINTS } from "@/config/api"
import "./index.css"

function App() {
  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="eyebrow">Phase 1 Scaffold</p>
        <h1>Ringle AI Tutor</h1>
        <p className="description">
          Rails API와 React 프론트엔드의 기본 연결 구성을 준비했어요.
        </p>
        <dl className="status-list">
          <div>
            <dt>Backend</dt>
            <dd>{API_ENDPOINTS.health}</dd>
          </div>
          <div>
            <dt>Frontend</dt>
            <dd>http://localhost:5173</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}

export default App
