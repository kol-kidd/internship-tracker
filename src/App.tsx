import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import Layout from "./layout/Layout";
import Register from "./pages/Registration";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { useAuthStore } from "./store/authStore";
import { useEffect, useState } from "react";
import { Bounce, ToastContainer } from "react-toastify";
import ApplicationList from "./pages/ApplicationList";
import LogsPage from "./pages/Logs";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import InternshipWorkspace from "./pages/InternshipWorkspace";
import { useProfileStore } from "./store/profileStore";
import {
  applyTheme,
  getStoredTheme,
  isDarkTheme,
  subscribeToThemePreference,
} from "./lib/theme";

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const profileTheme = useProfileStore((state) => state.profile?.theme_preference);
  const [activeTheme, setActiveTheme] = useState(() => getStoredTheme());

  useEffect(() => {
    const cleanup = initAuth();

    return () => {
      cleanup?.();
    };
  }, [initAuth]);

  useEffect(() => subscribeToThemePreference(setActiveTheme), []);

  useEffect(() => {
    if (!profileTheme) return;

    const timer = window.setTimeout(() => {
      setActiveTheme(applyTheme(profileTheme, { emit: false }));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [profileTheme]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Layout>
                <ApplicationList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/internships/:applicationId"
          element={
            <ProtectedRoute>
              <Layout>
                <InternshipWorkspace />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <Layout>
                <LogsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Leaderboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        theme={isDarkTheme(activeTheme) ? "dark" : "light"}
        transition={Bounce}
      />
    </>
  );
}

export default App;
