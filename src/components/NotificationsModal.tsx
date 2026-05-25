import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { X, Clock, Trash2, CalendarCheck, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationsModalProps {
  onClose: () => void;
}

export default function NotificationsModal({
  onClose,
}: NotificationsModalProps) {
  const { state, setNotificationState, togglePayment, toggleShoppingList } =
    useAppContext();
  const [snoozeModalFor, setSnoozeModalFor] = useState<string | null>(null);
  const [snoozeTime, setSnoozeTime] = useState("10:00");

  const now = new Date();

  const rawNotifications = [
    ...state.payments
      .filter((p) => !p.isCompleted && p.dueDate)
      .map((p) => ({
        id: p.id,
        title: p.title,
        dueDate: p.dueDate,
        type: "payment" as const,
      })),
    ...state.shoppingLists
      .filter((s) => !s.isCompleted && s.dueDate)
      .map((s) => ({
        id: s.id,
        title: s.title,
        dueDate: s.dueDate!,
        type: "shopping" as const,
      })),
  ];

  const activeNotifications = rawNotifications.filter((item) => {
    const notifState = (state.notifications || []).find(
      (n) => n.referenceId === item.id,
    );
    if (notifState?.dismissed) return false;

    // Check snooze
    if (notifState?.snoozedUntil) {
      return new Date(notifState.snoozedUntil).getTime() <= now.getTime();
    }

    // Default 10:00 AM on due date
    const targetDate = new Date(item.dueDate);
    targetDate.setHours(10, 0, 0, 0);

    // If today is past the target date/time, show it.
    // If targetDate is somehow invalid, skip it.
    if (isNaN(targetDate.getTime())) return false;

    return now.getTime() >= targetDate.getTime();
  });

  const handleSnooze = () => {
    if (!snoozeModalFor) return;

    const [hours, minutes] = snoozeTime.split(":").map(Number);
    const snoozeDate = new Date();
    snoozeDate.setHours(hours, minutes, 0, 0);

    // If selected time has already passed today, set to tomorrow
    if (snoozeDate.getTime() < now.getTime()) {
      snoozeDate.setDate(snoozeDate.getDate() + 1);
    }

    setNotificationState(snoozeModalFor, {
      snoozedUntil: snoozeDate.toISOString(),
    });
    setSnoozeModalFor(null);
  };

  const handleDismiss = (id: string, type: "payment" | "shopping") => {
    setNotificationState(id, { type, dismissed: true });
  };

  const handleMarkDone = (id: string, type: "payment" | "shopping") => {
    if (type === "payment") togglePayment(id);
    if (type === "shopping") toggleShoppingList(id);
    setNotificationState(id, { type, dismissed: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 max-h-[85vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-xl mr-3">
              Recordatorios
            </span>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
              {activeNotifications.length}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          {activeNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
              <CalendarCheck size={48} className="mb-4 opacity-50" />
              <p className="text-center font-medium">
                No tienes alertas pendientes
              </p>
              <p className="text-sm text-center mt-1 opacity-70">
                Todo está al día
              </p>
            </div>
          ) : (
            activeNotifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-500 dark:text-gray-400">
                      {notification.type === "payment"
                        ? "Pago"
                        : "Lista Compra"}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Para:{" "}
                      {format(new Date(notification.dueDate), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDismiss(notification.id, notification.type)
                    }
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors tooltip tooltip-left"
                    data-tip="Descartar"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() =>
                      handleMarkDone(notification.id, notification.type)
                    }
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <CheckCircle size={16} /> Completar
                  </button>
                  <button
                    onClick={() => setSnoozeModalFor(notification.id)}
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Clock size={16} /> Aplazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Snooze Modal */}
      {snoozeModalFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Aplazar Recordatorio
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Selecciona una nueva hora para que te recordemos.
            </p>

            <div className="flex justify-center mb-6">
              <input
                type="time"
                value={snoozeTime}
                onChange={(e) => setSnoozeTime(e.target.value)}
                className="text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none text-center pb-2 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSnoozeModalFor(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSnooze}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
