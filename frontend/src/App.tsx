import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ToastProvider, ToastViewport } from "@/components/Toast"
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
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
          <ToastViewport />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
