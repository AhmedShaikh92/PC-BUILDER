import React, { useState } from "react";
import {
  Settings,
  Package,
  DollarSign,
  LogOut,
  PlusCircle,
  MoveLeft,
  Home,
} from "lucide-react";
import { ComponentsManager } from "../components/admin/ComponentsManager";
import { PricesManager } from "../components/admin/PriceManager";
import { AdminAuth } from "../components/admin/AdminAuth";
import { Link } from "react-router-dom";

type TabType = "components" | "prices";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("components");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem("adminToken"),
  );

  // Check if token exists on mount
  React.useEffect(() => {
    if (adminToken) {
      setIsAuthenticated(true);
    }
  }, [adminToken]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    setIsAuthenticated(false);
  };

  const handleLogin = (token: string) => {
    localStorage.setItem("adminToken", token);
    setAdminToken(token);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-neutral-800 rounded-full blur-[150px] opacity-20" />
      </div>

      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl font-light text-neutral-100"
                style={{ fontFamily: "Rubik Distressed" }}
              >
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to={"/"}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <Home size={16} />
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-800 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("components")}
              className={`flex items-center gap-2 px-4 py-4 text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === "components"
                  ? "border-neutral-100 text-neutral-100"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Package size={16} />
              Components
            </button>
            <button
              onClick={() => setActiveTab("prices")}
              className={`flex items-center gap-2 px-4 py-4 text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === "prices"
                  ? "border-neutral-100 text-neutral-100"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <DollarSign size={16} />
              Prices
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "components" && (
          <ComponentsManager token={adminToken!} />
        )}
        {activeTab === "prices" && <PricesManager token={adminToken!} />}
      </main>
    </div>
  );
}
