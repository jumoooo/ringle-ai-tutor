import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ToastProvider, ToastViewport } from "@/components/Toast"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import AdminPage from "@/pages/AdminPage"
import ChatPage from "@/pages/ChatPage"
import HomePage from "@/pages/HomePage"
import LearnPage from "@/pages/LearnPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000
    }
  }
})

export default function App() {
  const { userId } = useCurrentUser()

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/chat"
              element={userId !== null ? <ChatPage /> : <Navigate to="/" replace />}
            />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          <ToastViewport />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
