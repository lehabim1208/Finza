import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAppContext } from "../context/AppContext";

function getIntervalForDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00"); // Avoid timezone shift
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  const getEndOfMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();

  if (day >= 15 && day <= 29) {
    // Quincena 2
    return {
      id: `${year}-${month}-Q2`,
      label: `15 al 29 de ${format(d, "MMM yyyy", { locale: es })}`,
      year,
      month,
      part: 2,
      start: new Date(year, month, 15),
      end: new Date(year, month, 29),
      paymentDateStr: format(
        new Date(year, month, Math.min(30, getEndOfMonth(year, month)), 12, 0, 0),
        "yyyy-MM-dd"
      ),
    };
  } else if (day >= 30 || day === getEndOfMonth(year, month)) {
    // Quincena 1 of next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const endD = new Date(nextYear, nextMonth, 14);
    const actualStartDay = Math.min(30, getEndOfMonth(year, month));
    const startD = new Date(year, month, actualStartDay);
    return {
      id: `${nextYear}-${nextMonth}-Q1`,
      label: `${actualStartDay} ${format(startD, "MMM")} al 14 ${format(endD, "MMM yyyy", { locale: es })}`,
      year: nextYear,
      month: nextMonth,
      part: 1,
      start: startD,
      end: endD,
      paymentDateStr: format(
        new Date(nextYear, nextMonth, 15, 12, 0, 0),
        "yyyy-MM-dd"
      ),
    };
  } else {
    // day is 1 to 14, Quincena 1 of current month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const endOfPrevMonth = getEndOfMonth(prevYear, prevMonth);
    const actualStartDay = Math.min(30, endOfPrevMonth);
    const startD = new Date(prevYear, prevMonth, actualStartDay);
    return {
      id: `${year}-${month}-Q1`,
      label: `${actualStartDay} ${format(startD, "MMM")} al 14 ${format(d, "MMM yyyy", { locale: es })}`,
      year,
      month,
      part: 1,
      start: startD,
      end: new Date(year, month, 14),
      paymentDateStr: format(new Date(year, month, 15, 12, 0, 0), "yyyy-MM-dd"),
    };
  }
}

export function getMonthlyIntervalForDate(dateStr: string, isNomina: boolean = false) {
  const d = new Date(dateStr + "T12:00:00");
  let month = d.getMonth();
  let year = d.getFullYear();
  
  if (isNomina) {
    const int = getIntervalForDate(dateStr);
    month = int.month;
    year = int.year;
  }
  
  const getEndOfMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();
  const startD = new Date(year, month, 1);
  const endD = new Date(year, month, getEndOfMonth(year, month));

  const dObj = new Date(year, month, 1);

  return {
    id: `m-${year}-${month}`,
    label: `Mes de ${format(dObj, "MMMM yyyy", { locale: es })}`,
    shortLabel: `${startD.getDate()} al ${endD.getDate()} de ${format(dObj, "MMM yyyy", { locale: es })}`,
    year,
    month,
  };
}

export function getGasWeek(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getTime());
  monday.setDate(d.getDate() + diff);

  const sunday = new Date(monday.getTime());
  sunday.setDate(monday.getDate() + 6);

  const paymentDate = new Date(sunday.getTime());
  paymentDate.setDate(sunday.getDate() + 2);

  return {
    id: `gas-${format(monday, "yyyy-MM-dd")}`,
    shortLabel: `${format(monday, "dd MMM", { locale: es })} - ${format(sunday, "dd MMM", { locale: es })}`,
    paymentLabel: `Pago: Mar ${format(paymentDate, "dd MMM", { locale: es })}`,
    sortKey: format(monday, "yyyy-MM-dd"),
  };
}

export default function DashboardView() {
  const { state } = useAppContext();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Aggregate by intervals
  const intervalsMap: Record<
    string,
    {
      interval: any;
      nomina: number;
    }
  > = {};

  const monthsMap: Record<
    string,
    {
      interval: any;
      income: number;
      expenses: number;
      pending: number;
    }
  > = {};

  const gasWeeksMap: Record<string, { interval: any; amount: number }> = {};

  state.shifts.forEach((shift) => {
    // Quincena (only salary goes to nomina)
    const int = getIntervalForDate(shift.date);
    if (!intervalsMap[int.id]) {
      intervalsMap[int.id] = {
        interval: int,
        nomina: 0,
      };
    }
    if (!shift.isIncome) {
      intervalsMap[int.id].nomina += shift.salary;
    }

    // Monthly Income
    const isNomina = !shift.isIncome;
    const monthInt = getMonthlyIntervalForDate(shift.date, isNomina);
    if (!monthsMap[monthInt.id]) {
      monthsMap[monthInt.id] = {
        interval: monthInt,
        income: 0,
        expenses: 0,
        pending: 0,
      };
    }
    
    let shouldAddIncome = true;
    if (isNomina) {
      if (int.paymentDateStr > todayStr) {
        shouldAddIncome = false;
      }
    } else {
      if (shift.date > todayStr) {
        shouldAddIncome = false;
      }
    }

    if (shouldAddIncome) {
      monthsMap[monthInt.id].income += shift.salary;
    }

    // Gasolinas (grouped by week)
    const gasInt = getGasWeek(shift.date);
    if (!gasWeeksMap[gasInt.id]) {
      gasWeeksMap[gasInt.id] = { interval: gasInt, amount: 0 };
    }
    gasWeeksMap[gasInt.id].amount += shift.gas;
  });

  state.payments.forEach((payment) => {
    const dateOnly = payment.dueDate.split("T")[0];
    const monthInt = getMonthlyIntervalForDate(dateOnly);
    if (!monthsMap[monthInt.id]) {
      monthsMap[monthInt.id] = {
        interval: monthInt,
        income: 0,
        expenses: 0,
        pending: 0,
      };
    }
    if (payment.isCompleted) {
      monthsMap[monthInt.id].expenses += payment.amount;
    } else {
      monthsMap[monthInt.id].pending += payment.amount;
    }
  });

  const sortedIntervals = Object.values(intervalsMap).sort((a, b) => {
    if (a.interval.year !== b.interval.year)
      return b.interval.year - a.interval.year;
    if (a.interval.month !== b.interval.month)
      return b.interval.month - a.interval.month;
    return b.interval.part - a.interval.part;
  });

  // Determine current interval by today's date
  const currentIntData = getIntervalForDate(todayStr);
  const currentGroup = intervalsMap[currentIntData.id] || {
    interval: currentIntData,
    nomina: 0,
  };

  const currentMonthIntData = getMonthlyIntervalForDate(todayStr);
  const currentMonthGroup = monthsMap[currentMonthIntData.id] || {
    interval: currentMonthIntData,
    income: 0,
    expenses: 0,
    pending: 0,
  };

  const balance = currentMonthGroup.income - currentMonthGroup.expenses;
  const projectedBalance = balance - currentMonthGroup.pending;

  const pastIntervals = sortedIntervals.filter(
    (g) => g.interval.id !== currentIntData.id,
  );

  // Determine current gas week
  const sortedGasWeeks = Object.values(gasWeeksMap).sort((a, b) =>
    b.interval.sortKey.localeCompare(a.interval.sortKey),
  );
  const currentGasIntData = getGasWeek(todayStr);
  const currentGasGroup = gasWeeksMap[currentGasIntData.id] || {
    interval: currentGasIntData,
    amount: 0,
  };
  const pastGasWeeks = sortedGasWeeks.filter(
    (g) => g.interval.id !== currentGasIntData.id,
  );

  // Modals state
  const [selectedIngresosInterval, setSelectedIngresosInterval] =
    React.useState<string | null>(null);
  const [selectedGastosInterval, setSelectedGastosInterval] = React.useState<
    string | null
  >(null);
  const [selectedNominaInterval, setSelectedNominaInterval] = React.useState<
    string | null
  >(null);
  const [selectedGasolinaInterval, setSelectedGasolinaInterval] =
    React.useState<string | null>(null);

  const getIngresosDetailsForInterval = (intId: string) => {
    const intervalShifts = state.shifts
      .filter((s) => {
        const isNomina = !s.isIncome;
        const monthInt = getMonthlyIntervalForDate(s.date, isNomina);
        if (monthInt.id !== intId || s.salary <= 0) return false;
        
        const int = getIntervalForDate(s.date);
        if (isNomina) {
          return int.paymentDateStr <= todayStr;
        } else {
          return s.date <= todayStr;
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    const total = intervalShifts.reduce((acc, s) => acc + s.salary, 0);
    return { shifts: intervalShifts, total };
  };

  const getNominaDetailsForInterval = (intId: string) => {
    const intervalShifts = state.shifts
      .filter((s) => getIntervalForDate(s.date).id === intId && !s.isIncome)
      .sort((a, b) => a.date.localeCompare(b.date));
    const totalNomina = intervalShifts.reduce((acc, s) => acc + s.salary, 0);
    const totalGas = intervalShifts.reduce((acc, s) => acc + s.gas, 0);
    return { shifts: intervalShifts, totalNomina, totalGas };
  };

  const getGasolinaDetailsForInterval = (intId: string) => {
    const intervalShifts = state.shifts
      .filter((s) => getGasWeek(s.date).id === intId && s.gas > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    const totalGas = intervalShifts.reduce((acc, s) => acc + s.gas, 0);
    return { shifts: intervalShifts, totalGas };
  };

  const getGastosDetailsForInterval = (intId: string) => {
    const intervalPayments = state.payments
      .filter(
        (p) => getMonthlyIntervalForDate(p.dueDate.split("T")[0]).id === intId,
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const totalCompleted = intervalPayments
      .filter((p) => p.isCompleted)
      .reduce((acc, p) => acc + p.amount, 0);
    const totalPending = intervalPayments
      .filter((p) => !p.isCompleted)
      .reduce((acc, p) => acc + p.amount, 0);
    return { payments: intervalPayments, totalCompleted, totalPending };
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f8f9fa] dark:bg-gray-900 text-[#202124] dark:text-gray-200 p-4 space-y-6 pb-24">
      {/* Current Interval Header */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Calendar size={80} />
        </div>
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full mb-3">
            Mes Actual
          </div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
            {currentMonthGroup.interval.label} (
            {currentMonthGroup.interval.shortLabel})
          </h2>
          <div className="mt-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Balance del mes
            </div>
            <div
              className={`text-4xl font-bold mt-1 ${balance < 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
            >
              ${balance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {projectedBalance < 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-2xl p-4 flex items-start space-x-3 text-red-700 dark:text-red-300">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm leading-tight">
            <span className="font-bold">Advertencia:</span> Si pagas todos tus
            pendientes de este mes, tu balance será negativo ($
            {projectedBalance.toFixed(2)}).
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
          <div className="flex justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <TrendingUp size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Ingresos
              </span>
            </div>
            <button
              onClick={() =>
                setSelectedIngresosInterval(currentMonthGroup.interval.id)
              }
              className="text-[10px] font-bold uppercase underline text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Ver detalle
            </button>
          </div>
          <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
            ${currentMonthGroup.income.toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
          <div className="flex justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <TrendingDown size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Gastos
              </span>
            </div>
            <button
              onClick={() =>
                setSelectedGastosInterval(currentMonthGroup.interval.id)
              }
              className="text-[10px] font-bold uppercase underline text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Ver detalle
            </button>
          </div>
          <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
            ${currentMonthGroup.expenses.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pendiente: ${currentMonthGroup.pending.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Nómina Section */}
      <div className="pt-2">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 px-2">
          Control de Nómina
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md inline-block mb-1">
                  Quincena Actual
                </div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
                  {currentGroup.interval.label}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${currentGroup.nomina.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={() =>
                  setSelectedNominaInterval(currentGroup.interval.id)
                }
                className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Ver detalle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gasolinas Section */}
      <div className="pt-2">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 px-2">
          Control de Gasolinas
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-md inline-block mb-1">
                  Semana en curso
                </div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {currentGasGroup.interval.shortLabel}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${currentGasGroup.amount.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={() =>
                  setSelectedGasolinaInterval(currentGasGroup.interval.id)
                }
                className="text-xs font-bold uppercase text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                Ver detalle
              </button>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
              {currentGasGroup.interval.paymentLabel} (Próximo)
            </div>
          </div>

          {pastGasWeeks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mt-2">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Historial de Gasolinas
                </h4>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {pastGasWeeks.map((gw) => (
                  <div key={gw.interval.id} className="p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {gw.interval.shortLabel}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                          {gw.interval.paymentLabel}
                        </div>
                      </div>
                      <div className="text-base font-bold text-green-600 dark:text-green-400">
                        ${gw.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-gray-50 dark:border-gray-700">
                      <button
                        onClick={() =>
                          setSelectedGasolinaInterval(gw.interval.id)
                        }
                        className="text-[10px] font-bold uppercase text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        Ver detalle de Gasolina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {pastIntervals.length > 0 && (
        <div className="pt-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 px-2">
            Historial de Quincenas
          </h3>
          <div className="space-y-3">
            {pastIntervals.map((group) => {
              return (
                <div
                  key={group.interval.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[13px] font-bold text-gray-700 dark:text-gray-300 capitalize mb-1">
                        {group.interval.label}
                      </div>
                    </div>
                    <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      ${group.nomina.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                    <button
                      onClick={() =>
                        setSelectedNominaInterval(group.interval.id)
                      }
                      className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Ver detalle de Nómina
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ingresos Details Modal */}
      {selectedIngresosInterval && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Detalle de Ingresos
              </h3>
              <button
                onClick={() => setSelectedIngresosInterval(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <span className="text-xl font-bold leading-none">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {(() => {
                const { shifts, total } = getIngresosDetailsForInterval(
                  selectedIngresosInterval,
                );
                if (shifts.length === 0) {
                  return (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                      No hay ingresos registrados en este periodo.
                    </p>
                  );
                }
                return (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800/50 mb-6 flex justify-between items-center">
                      <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                        Total Ingresos
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${total.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Desglose de Ingresos
                      </h4>
                      {shifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl flex justify-between items-center"
                        >
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                              {format(
                                new Date(shift.date + "T12:00:00"),
                                "EEEE dd MMM",
                                { locale: es },
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              {shift.isIncome ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">
                                  Manual
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                  Nómina
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                {shift.source
                                  ? `De: ${shift.source}`
                                  : shift.store}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              +${shift.salary.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
            <button
              onClick={() => setSelectedIngresosInterval(null)}
              className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-xl font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Nomina Details Modal */}
      {selectedNominaInterval && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Detalle de Nómina
              </h3>
              <button
                onClick={() => setSelectedNominaInterval(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="text-xl font-bold leading-none">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {(() => {
                const { shifts, totalNomina, totalGas } =
                  getNominaDetailsForInterval(selectedNominaInterval);
                if (shifts.length === 0) {
                  return (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                      No hay días trabajados en esta nómina.
                    </p>
                  );
                }
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                          Total Nómina
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          ${totalNomina.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-2xl border border-green-100 dark:border-green-800/50">
                        <div className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">
                          Total Gasolinas
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          ${totalGas.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Desglose por Día
                      </h4>
                      {shifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl flex justify-between items-center"
                        >
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                              {format(
                                new Date(shift.date + "T12:00:00"),
                                "EEEE dd MMM",
                                { locale: es },
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {shift.store}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              Nómina: ${shift.salary.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
            <button
              onClick={() => setSelectedNominaInterval(null)}
              className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-xl font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Gasolinas Details Modal */}
      {selectedGasolinaInterval && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Detalle de Gasolinas
              </h3>
              <button
                onClick={() => setSelectedGasolinaInterval(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <span className="text-xl font-bold leading-none">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {(() => {
                const { shifts, totalGas } = getGasolinaDetailsForInterval(
                  selectedGasolinaInterval,
                );
                if (shifts.length === 0) {
                  return (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                      No hay gasolinas registradas en esta semana.
                    </p>
                  );
                }
                return (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-800/50 mb-6 flex justify-between items-center">
                      <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                        Total Gasolinas
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${totalGas.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Desglose de Gasolinas
                      </h4>
                      {shifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl flex justify-between items-center"
                        >
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                              {format(
                                new Date(shift.date + "T12:00:00"),
                                "EEEE dd MMM",
                                { locale: es },
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[150px]">
                              {shift.store}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">
                              +${shift.gas.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
            <button
              onClick={() => setSelectedGasolinaInterval(null)}
              className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-xl font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* Gastos Details Modal */}
      {selectedGastosInterval && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Detalle de Gastos
              </h3>
              <button
                onClick={() => setSelectedGastosInterval(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <span className="text-xl font-bold leading-none">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {(() => {
                const { payments, totalCompleted, totalPending } =
                  getGastosDetailsForInterval(selectedGastosInterval);
                if (payments.length === 0) {
                  return (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                      No hay gastos registrados en este periodo.
                    </p>
                  );
                }
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-800/50">
                        <div className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                          Pagados
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          ${totalCompleted.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-2xl border border-orange-100 dark:border-orange-800/50">
                        <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
                          Pendientes
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          ${totalPending.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Desglose de Gastos
                      </h4>
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl flex justify-between items-center"
                        >
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                              {payment.title}
                              {!payment.isCompleted && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                  Pendiente
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {format(
                                new Date(
                                  payment.dueDate.split("T")[0] + "T12:00:00",
                                ),
                                "EEEE dd MMM",
                                { locale: es },
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div
                              className={`text-sm font-bold ${payment.isCompleted ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
                            >
                              ${payment.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
            <button
              onClick={() => setSelectedGastosInterval(null)}
              className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-xl font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
