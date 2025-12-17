import { Link, useNavigate } from "react-router-dom";
import React from "react";
import CustomButton from "@/components/Buttons";
import { signOut } from "@/functions/auth/signOut";
interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    const { error } = await signOut();

    if (error) {
      console.log("Logout error: ", error);
    } else {
      navigate("/");
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <nav className="flex justify-between">
          <h1 className="font-bold">OJT Tracker</h1>
          <div className="flex flex-row gap-2 items-center">
            <Link to="/dashboard" className="mr-4">
              Dashboard
            </Link>
            <CustomButton
              variant="contained"
              onClick={handleLogout}
              text="Logout"
            />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-200 text-center p-4">
        &copy; {new Date().getFullYear()} OJT Tracker
      </footer>
    </div>
  );
};

export default Layout;
