import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";

export type Shift = {
  id: string;
  date: string; // YYYY-MM-DD
  store: string;
  salary: number;
  gas: number;
  total: number;
  isIncome?: boolean;
  source?: string;
};

export type GenericPayment = {
  id: string;
  type: "simple" | "recurring" | "debt";
  title: string;
  amount: number;
  totalAmount?: number; // For debts
  paidAmount?: number; // For debts
  dueDate: string; // ISO string
  isCompleted: boolean;
  notes?: string;
  person?: string;
  installmentsTotal?: number;
  installmentsPaid?: number;
  installmentAmount?: number;
  isFavorite?: boolean;
  completedAt?: string;
};

export type ShoppingItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  amount?: number;
};

export type ShoppingList = {
  id: string;
  title: string;
  items: ShoppingItem[];
  dueDate?: string;
  isCompleted: boolean;
  isFavorite?: boolean;
  completedAt?: string;
};

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  type: "savings" | "investment";
  account?: string;
};

export type CalculatorHistoryItem = {
  id: string;
  expression: string;
  result: string;
  date: string;
};

export type NotificationState = {
  id: string;
  type: "payment" | "shopping";
  referenceId: string;
  dismissed: boolean;
  snoozedUntil?: string;
};

type AppState = {
  shifts: Shift[];
  payments: GenericPayment[];
  shoppingLists: ShoppingList[];
  goals: Goal[];
  calculatorHistory: CalculatorHistoryItem[];
  notifications: NotificationState[];
};

type AppContextType = {
  state: AppState;
  addShift: (shift: Omit<Shift, "id" | "total">) => void;
  deleteShift: (id: string) => void;
  editShift: (id: string, updates: Partial<Shift>) => void;
  addPayment: (payment: Omit<GenericPayment, "id">) => void;
  deletePayment: (id: string) => void;
  editPayment: (id: string, payment: Partial<GenericPayment>) => void;
  togglePayment: (id: string) => void;
  toggleFavoritePayment: (id: string) => void;
  updatePaymentInstallment: (id: string, increment: boolean) => void;
  addShoppingList: (list: Omit<ShoppingList, "id">) => void;
  deleteShoppingList: (id: string) => void;
  toggleFavoriteShoppingList: (id: string) => void;
  toggleShoppingItem: (listId: string, itemId: string) => void;
  toggleShoppingList: (id: string) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  deleteGoal: (id: string) => void;
  editGoal: (id: string, updates: Partial<Goal>) => void;
  updateGoalProgress: (id: string, amount: number) => void;
  addCalcHistory: (item: Omit<CalculatorHistoryItem, "id" | "date">) => void;
  clearCalcHistory: () => void;
  setNotificationState: (
    referenceId: string,
    updates: Partial<NotificationState>,
  ) => void;
  resetData: () => void;
};

const defaultState: AppState = {
  shifts: [],
  payments: [],
  shoppingLists: [],
  goals: [],
  calculatorHistory: [],
  notifications: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("finance_tracker_state");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem("finance_tracker_state", JSON.stringify(state));
  }, [state]);

  // Optionally load data from Supabase once on mount
  useEffect(() => {
    if (!supabase) return;
    const fetchSupabase = async () => {
      try {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        const isoFifteenDaysAgo = fifteenDaysAgo.toISOString();

        // Optional: you can run a cleanup here if needed, but doing it safely via Supabase is better.
        // For example, delete where isCompleted = true AND completedAt < isoFifteenDaysAgo.
        // await supabase.from('payments').delete().eq('isCompleted', true).lt('completedAt', isoFifteenDaysAgo);

        const [
          { data: shiftsData },
          { data: paymentsData },
          { data: shoppingData },
          { data: goalsData },
        ] = await Promise.all([
          supabase.from("shifts").select("*"),
          supabase.from("payments").select("*"),
          supabase.from("shopping_lists").select("*"),
          supabase.from("goals").select("*"),
        ]);

        setState((prev) => {
          const validPayments =
            (paymentsData as GenericPayment[])?.filter(
              (p) =>
                !p.isCompleted ||
                !p.completedAt ||
                new Date(p.completedAt) > fifteenDaysAgo,
            ) || prev.payments;
          const validShopping =
            (shoppingData as ShoppingList[])?.filter(
              (s) =>
                !s.isCompleted ||
                !s.completedAt ||
                new Date(s.completedAt) > fifteenDaysAgo,
            ) || prev.shoppingLists;

          return {
            ...prev,
            shifts:
              shiftsData && shiftsData.length > 0
                ? (shiftsData as Shift[])
                : prev.shifts,
            payments: validPayments,
            shoppingLists: validShopping,
            goals:
              goalsData && goalsData.length > 0
                ? (goalsData as Goal[])
                : prev.goals,
          };
        });
      } catch (err) {
        console.error("Error fetching from Supabase", err);
      }
    };
    fetchSupabase();
  }, []);

  const addCalcHistory = (item: Omit<CalculatorHistoryItem, "id" | "date">) => {
    setState((prev) => ({
      ...prev,
      calculatorHistory: [
        { ...item, id: uuidv4(), date: new Date().toISOString() },
        ...(prev.calculatorHistory || []),
      ].slice(0, 50),
    }));
  };

  const clearCalcHistory = () => {
    setState((prev) => ({ ...prev, calculatorHistory: [] }));
  };

  const setNotificationState = (
    referenceId: string,
    updates: Partial<NotificationState>,
  ) => {
    setState((prev) => {
      const existing = (prev.notifications || []).find(
        (n) => n.referenceId === referenceId,
      );
      if (existing) {
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.referenceId === referenceId ? { ...n, ...updates } : n,
          ),
        };
      } else {
        return {
          ...prev,
          notifications: [
            ...(prev.notifications || []),
            {
              id: uuidv4(),
              referenceId,
              type: updates.type || "payment", // fallback
              dismissed: updates.dismissed || false,
              ...updates,
            } as NotificationState,
          ],
        };
      }
    });
  };

  const addShift = async (shift: Omit<Shift, "id" | "total">) => {
    const newShift: Shift = {
      ...shift,
      id: uuidv4(),
      total: shift.salary + shift.gas,
    };
    setState((prev) => ({ ...prev, shifts: [...prev.shifts, newShift] }));
    if (supabase) {
      const { error } = await supabase.from("shifts").insert([newShift]);
      if (error) console.error("Error inserting shift:", error);
    }
  };

  const deleteShift = async (id: string) => {
    setState((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((s) => s.id !== id),
    }));
    if (supabase) {
      const { error } = await supabase.from("shifts").delete().eq("id", id);
      if (error) console.error("Error deleting shift:", error);
    }
  };

  const editShift = async (id: string, updates: Partial<Shift>) => {
    setState((prev) => ({
      ...prev,
      shifts: prev.shifts.map((s) => {
        if (s.id === id) {
          const updatedShift = { ...s, ...updates };
          updatedShift.total = updatedShift.salary + updatedShift.gas;
          return updatedShift;
        }
        return s;
      }),
    }));
    if (supabase) {
      // Recalculate total for supabase update too if needed
      const currentShift = state.shifts.find((s) => s.id === id);
      const newSalary =
        updates.salary !== undefined
          ? updates.salary
          : currentShift?.salary || 0;
      const newGas =
        updates.gas !== undefined ? updates.gas : currentShift?.gas || 0;
      const { error } = await supabase
        .from("shifts")
        .update({ ...updates, total: newSalary + newGas })
        .eq("id", id);
      if (error) console.error("Error updating shift:", error);
    }
  };

  const addPayment = async (payment: Omit<GenericPayment, "id">) => {
    const newPayment: GenericPayment = { ...payment, id: uuidv4() };
    setState((prev) => ({ ...prev, payments: [...prev.payments, newPayment] }));
    if (supabase) {
      const { error } = await supabase.from("payments").insert([newPayment]);
      if (error) console.error("Error inserting payment:", error);
    }
  };

  const deletePayment = async (id: string) => {
    setState((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }));
    if (supabase) {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) console.error("Error deleting payment:", error);
    }
  };

  const editPayment = async (id: string, updates: Partial<GenericPayment>) => {
    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    }));
    if (supabase) {
      const { error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id);
      if (error) console.error("Error updating payment:", error);
    }
  };

  const toggleFavoritePayment = async (id: string) => {
    const payment = state.payments.find((p) => p.id === id);
    if (!payment) return;
    const newValue = !payment.isFavorite;

    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === id ? { ...p, isFavorite: newValue } : p,
      ),
    }));

    if (supabase) {
      const { error } = await supabase
        .from("payments")
        .update({ isFavorite: newValue })
        .eq("id", id);
      if (error) console.error("Error updating payment fav:", error);
    }
  };

  const togglePayment = async (id: string) => {
    const payment = state.payments.find((p) => p.id === id);
    if (!payment) return;
    const isCompleted = !payment.isCompleted;
    const completedAt = isCompleted ? new Date().toISOString() : undefined;

    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === id ? { ...p, isCompleted, completedAt } : p,
      ),
    }));

    if (supabase) {
      const { error } = await supabase
        .from("payments")
        .update({ isCompleted, completedAt })
        .eq("id", id);
      if (error) console.error("Error updating payment:", error);
    }
  };

  const updatePaymentInstallment = async (id: string, increment: boolean) => {
    let updatedPayment: GenericPayment | undefined;

    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => {
        if (p.id === id) {
          const currentPaid = p.installmentsPaid || 0;
          let newPaid = increment ? currentPaid + 1 : currentPaid - 1;
          if (newPaid < 0) newPaid = 0;
          if (p.installmentsTotal && newPaid > p.installmentsTotal)
            newPaid = p.installmentsTotal;

          const isCompleted = p.installmentsTotal
            ? newPaid >= p.installmentsTotal
            : p.isCompleted;

          updatedPayment = { ...p, installmentsPaid: newPaid, isCompleted };
          return updatedPayment;
        }
        return p;
      }),
    }));

    if (supabase && updatedPayment) {
      const { error } = await supabase
        .from("payments")
        .update({
          installmentsPaid: updatedPayment.installmentsPaid,
          isCompleted: updatedPayment.isCompleted,
        })
        .eq("id", id);
      if (error) console.error("Error updating payment installments:", error);
    }
  };

  const addShoppingList = async (list: Omit<ShoppingList, "id">) => {
    const newList: ShoppingList = { ...list, id: uuidv4() };
    setState((prev) => ({
      ...prev,
      shoppingLists: [...prev.shoppingLists, newList],
    }));
    if (supabase) {
      const { error } = await supabase.from("shopping_lists").insert([newList]);
      if (error) console.error("Error inserting shopping list:", error);
    }
  };

  const deleteShoppingList = async (id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingLists: prev.shoppingLists.filter((p) => p.id !== id),
    }));
    if (supabase) {
      const { error } = await supabase
        .from("shopping_lists")
        .delete()
        .eq("id", id);
      if (error) console.error("Error deleting shopping list:", error);
    }
  };

  const toggleFavoriteShoppingList = async (id: string) => {
    const list = state.shoppingLists.find((p) => p.id === id);
    if (!list) return;
    const isFavorite = !list.isFavorite;

    setState((prev) => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map((p) =>
        p.id === id ? { ...p, isFavorite } : p,
      ),
    }));

    if (supabase) {
      const { error } = await supabase
        .from("shopping_lists")
        .update({ isFavorite })
        .eq("id", id);
      if (error) console.error("Error updating shopping list fav:", error);
    }
  };

  const toggleShoppingItem = async (listId: string, itemId: string) => {
    let updatedList: ShoppingList | undefined;

    setState((prev) => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map((list) => {
        if (list.id === listId) {
          const newItems = list.items.map((item) =>
            item.id === itemId
              ? { ...item, isCompleted: !item.isCompleted }
              : item,
          );
          const allCompleted = newItems.every((i) => i.isCompleted);
          const completedAt = allCompleted
            ? new Date().toISOString()
            : undefined;
          const newListState = {
            ...list,
            items: newItems,
            isCompleted: allCompleted,
            completedAt,
          };
          updatedList = newListState;
          return newListState;
        }
        return list;
      }),
    }));

    if (supabase && updatedList) {
      const { error } = await supabase
        .from("shopping_lists")
        .update({
          items: updatedList.items,
          isCompleted: updatedList.isCompleted,
          completedAt: updatedList.completedAt,
        })
        .eq("id", listId);
      if (error) console.error("Error updating shopping list:", error);
    }
  };

  const toggleShoppingList = async (id: string) => {
    const list = state.shoppingLists.find((p) => p.id === id);
    if (!list) return;
    const isCompleted = !list.isCompleted;
    const completedAt = isCompleted ? new Date().toISOString() : undefined;

    // Mark all items as completed if the list is completed
    const newItems = list.items.map((item) => ({
      ...item,
      isCompleted: isCompleted,
    }));

    setState((prev) => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map((p) =>
        p.id === id ? { ...p, isCompleted, completedAt, items: newItems } : p,
      ),
    }));

    if (supabase) {
      const { error } = await supabase
        .from("shopping_lists")
        .update({ isCompleted, completedAt, items: newItems })
        .eq("id", id);
      if (error) console.error("Error updating shopping list status:", error);
    }
  };

  const addGoal = async (goal: Omit<Goal, "id">) => {
    const newGoal: Goal = { ...goal, id: uuidv4() };
    setState((prev) => ({ ...prev, goals: [...prev.goals, newGoal] }));
    if (supabase) {
      const { error } = await supabase.from("goals").insert([newGoal]);
      if (error) console.error("Error inserting goal:", error);
    }
  };

  const updateGoalProgress = async (id: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? { ...g, currentAmount: amount } : g,
      ),
    }));

    if (supabase) {
      const { error } = await supabase
        .from("goals")
        .update({ currentAmount: amount })
        .eq("id", id);
      if (error) console.error("Error updating goal:", error);
    }
  };

  const deleteGoal = async (id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
    if (supabase) {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) console.error("Error deleting goal:", error);
    }
  };

  const editGoal = async (id: string, updates: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
    if (supabase) {
      const { error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id);
      if (error) console.error("Error updating goal:", error);
    }
  };

  const resetData = async () => {
    setState((prev) => ({ ...prev, shifts: [], payments: [] }));
    if (supabase) {
      await supabase
        .from("shifts")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase
        .from("payments")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addShift,
        deleteShift,
        editShift,
        addPayment,
        editPayment,
        deletePayment,
        togglePayment,
        toggleFavoritePayment,
        updatePaymentInstallment,
        addShoppingList,
        deleteShoppingList,
        toggleFavoriteShoppingList,
        toggleShoppingItem,
        toggleShoppingList,
        addGoal,
        deleteGoal,
        editGoal,
        updateGoalProgress,
        addCalcHistory,
        clearCalcHistory,
        setNotificationState,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within an AppProvider");
  return context;
};
