import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  Target,
  ListTodo,
  Settings,
  RefreshCcw,
  Calculator as CalculatorIcon,
  Bell,
} from "lucide-react";
import DashboardView from "./views/DashboardView";
import CalendarView from "./views/CalendarView";
import TasksView from "./views/TasksView";
import GoalsView from "./views/GoalsView";
import { useAppContext } from "./context/AppContext";
import { useToast } from "./context/ToastContext";
import Calculator from "./components/Calculator";
import NotificationsModal from "./components/NotificationsModal";

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<"claro" | "oscuro" | "sistema">("sistema");

  const { state, resetData } = useAppContext();
  const { addToast } = useToast();

  const activeNotificationsCount =
    state.notifications?.filter((n) => {
      if (n.dismissed) return false;
      if (
        n.snoozedUntil &&
        new Date(n.snoozedUntil).getTime() > new Date().getTime()
      )
        return false;
      return true;
    }).length || 0;

  useEffect(() => {
    const savedTheme = localStorage.getItem("app_theme") as
      | "claro"
      | "oscuro"
      | "sistema"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("app_theme", theme);

    const applyTheme = () => {
      const isDark =
        theme === "oscuro" ||
        (theme === "sistema" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    if (theme === "sistema") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const handleReset = () => {
    if (
      window.confirm(
        "¿Seguro que deseas eliminar todos los ingresos y egresos? Esta acción no se puede deshacer.",
      )
    ) {
      resetData();
      addToast("Datos reseteados", "success");
      setIsSettingsOpen(false);
    }
  };

  const tabs = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      component: DashboardView,
    },
    {
      id: "calendar",
      icon: CalendarDays,
      label: "Calendario",
      component: CalendarView,
    },
    { id: "tasks", icon: ListTodo, label: "Tareas", component: TasksView },
    { id: "goals", icon: Target, label: "Metas", component: GoalsView },
  ];

  const ActiveComponent =
    tabs.find((t) => t.id === activeTab)?.component || DashboardView;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="h-[72px] shrink-0 px-6 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 z-10 transition-shadow">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          {tabs.find((t) => t.id === activeTab)?.label}
        </h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCalcOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors relative"
          >
            <CalculatorIcon size={20} />
          </button>
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors relative"
          >
            <Bell size={20} />
            {activeNotificationsCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative">
        <ActiveComponent />
      </main>

      {/* Bottom Navigation */}
      <footer className="h-20 shrink-0 w-full bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe z-20">
        <nav className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center w-full h-full relative group"
              >
                <div
                  className={`flex items-center justify-center w-16 h-8 rounded-full mb-1 transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-transparent text-gray-600 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-700"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors ${isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[24px] shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Ajustes
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  Apariencia
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme("claro")}
                    className={`py-2 rounded-xl border text-sm font-medium ${theme === "claro" ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"}`}
                  >
                    Claro
                  </button>
                  <button
                    onClick={() => setTheme("oscuro")}
                    className={`py-2 rounded-xl border text-sm font-medium ${theme === "oscuro" ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"}`}
                  >
                    Oscuro
                  </button>
                  <button
                    onClick={() => setTheme("sistema")}
                    className={`py-2 rounded-xl border text-sm font-medium ${theme === "sistema" ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"}`}
                  >
                    Sistema
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="mt-8 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-xl font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {isCalcOpen && <Calculator onClose={() => setIsCalcOpen(false)} />}

      {isNotificationsOpen && (
        <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />
      )}
    </div>
  );
}
