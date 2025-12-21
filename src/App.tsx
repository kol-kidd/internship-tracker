import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./layout/Layout";
import Register from "./pages/Registration";
import AuthCallback from "./pages/AuthCallback";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import { useAppStore } from "./store/applicationStore";

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initApp = useAppStore((state) => state.initApp);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      unsubscribe = await initApp();
    };

    init();

    return () => {
      unsubscribe?.();
    };
  }, [initApp]);

  useEffect(() => {
    const cleanup = initAuth();

    return () => {
      cleanup?.();
    };
  }, [initAuth]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;
