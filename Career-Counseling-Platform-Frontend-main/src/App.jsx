import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { PricingProvider } from "./context/PricingContext";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";

import { AssignmentList } from "./components/ui/AssignmentList";
import Assignments from "./pages/Assignments";



import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import Counseling from "./pages/Counseling";
import Resources from "./pages/Resources";
import ResourceDetail from "./pages/ResourceDetail";
import JobBoard from "./pages/JobBoard";
import Forum from "./pages/Forum";
import AdminPanel from "./pages/AdminPanel";
import Pricing from "./pages/Pricing";
import MeetingRoom from "./pages/MeetingRoom";
import Community from "./pages/Community";
import ResumeReview from "./pages/ResumeReview";
import Layout from "./components/Layout";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] font-sans text-[var(--text-primary)] transition-colors duration-300">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
  path="/assignments"
  element={
    <ProtectedRoute>
      <Assignments />
    </ProtectedRoute>
  }
/>

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/counseling" element={<ProtectedRoute><Counseling /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
        <Route path="/resources/:id" element={<ProtectedRoute><ResourceDetail /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobBoard /></ProtectedRoute>} />
        <Route path="/forum" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/meeting" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumeReview /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <PricingProvider>
            <ChatProvider>
              <AppRoutes />
            </ChatProvider>
          </PricingProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}