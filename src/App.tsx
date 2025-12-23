import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./layout/Layout";
import Register from "./pages/Registration";
import AuthCallback from "./pages/AuthCallback";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import { Bounce, ToastContainer } from "react-toastify";
import ApplicationList from "./pages/ApplicationList";

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

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
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        theme="light"
        transition={Bounce}
      />
    </>
  );
}

export default App;
