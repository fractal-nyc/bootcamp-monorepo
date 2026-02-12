import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import './App.css'
import { AuthProvider } from './hooks/useAuth'
import { RootLayout } from './components/RootLayout'
import { LoginPage } from './pages/LoginPage'
import { StudentPage } from './pages/StudentPage'
import { InstructorPage } from './pages/InstructorPage'
import { SimulatorPage } from './pages/SimulatorPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/student/*" element={<StudentPage />} />
            <Route path="/instructor/*" element={<InstructorPage />} />
            <Route path="/simulations/:kind/:flowId?" element={<SimulatorPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
