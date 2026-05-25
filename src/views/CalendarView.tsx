import React, { useState } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, DollarSign, Briefcase } from 'lucide-react';
import { useAppContext, Shift } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export default function CalendarView() {
  const { state, addShift, editShift, deleteShift } = useAppContext();
  const { addToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  // Shift Form states
  const [storeName, setStoreName] = useState<'Walmart Cristal' | 'Bodega Aurrera'>('Walmart Cristal');
  
  // Income states
  const [incomeTitle, setIncomeTitle] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('');

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  const getShiftsForDay = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return state.shifts.filter(s => s.date === formattedDate);
  };

  const hasShiftForDay = (date: Date) => {
    return getShiftsForDay(date).some(s => !s.isIncome);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dayShifts = getShiftsForDay(day);
    if (dayShifts.length > 0) {
      setIsDayDetailOpen(true);
    } else {
       setIsTypeSelectorOpen(true);
    }
  };

  const openShiftModal = (shift: Shift | null = null, day: Date | null = null) => {
     if (day) setSelectedDate(day);
     if (shift) {
        setEditingShiftId(shift.id);
        setStoreName(shift.store as 'Walmart Cristal' | 'Bodega Aurrera');
     } else {
        setEditingShiftId(null);
        setStoreName('Walmart Cristal');
     }
     setIsTypeSelectorOpen(false);
     setIsDayDetailOpen(false);
     setIsShiftModalOpen(true);
  };

  const openIncomeModal = (shift: Shift | null = null) => {
     if (shift) {
        setEditingShiftId(shift.id);
        setIncomeTitle(shift.store);
        setIncomeAmount(shift.salary.toString());
        setIncomeSource(shift.source || '');
     } else {
        setEditingShiftId(null);
        setIncomeTitle('');
        setIncomeAmount('');
        setIncomeSource('');
     }
     setIsTypeSelectorOpen(false);
     setIsDayDetailOpen(false);
     setIsIncomeModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && storeName) {
      
      let salary = 400;
      let gas = storeName === 'Walmart Cristal' ? 230 : 200;

      if (editingShiftId) {
         editShift(editingShiftId, {
            store: storeName,
            salary,
            gas,
            isIncome: false
         });
         addToast('Turno actualizado', 'success');
      } else {
         addShift({
           date: format(selectedDate, 'yyyy-MM-dd'),
           store: storeName,
           salary,
           gas,
           isIncome: false
         });
         addToast('Turno guardado', 'success');
      }
      setIsShiftModalOpen(false);
    }
  };

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && incomeTitle && incomeAmount) {
       const amount = parseFloat(incomeAmount);
       if (isNaN(amount)) return addToast('Monto inválido', 'error');

       if (editingShiftId) {
          editShift(editingShiftId, {
             store: incomeTitle,
             salary: amount,
             gas: 0,
             source: incomeSource,
             isIncome: true
          });
          addToast('Ingreso actualizado', 'success');
       } else {
          addShift({
             date: format(selectedDate, 'yyyy-MM-dd'),
             store: incomeTitle,
             salary: amount,
             gas: 0,
             source: incomeSource,
             isIncome: true
          });
          addToast('Ingreso guardado', 'success');
       }
       setIsIncomeModalOpen(false);
    }
  };

  const toTitleCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 relative">
      {/* Calendar Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </span>
        </div>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 mb-2 px-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-[1fr] gap-1 px-2 pb-2 overflow-y-auto">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          const dayShifts = getShiftsForDay(day);

          return (
            <div 
              key={i} 
              onClick={() => handleDayClick(day)}
              className={`
                flex flex-col rounded-xl p-1.5 border border-transparent bg-white dark:bg-gray-800 shadow-sm overflow-hidden
                transition-all cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md
                ${!isCurrentMonth ? 'opacity-40 bg-gray-50 dark:bg-transparent dark:opacity-30' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                  ${isDayToday ? 'bg-[#1a73e8] text-white' : 'text-gray-700 dark:text-gray-300'}
                `}>
                  {format(day, 'd')}
                </span>
                {dayShifts.length > 0 && (
                  <span className="text-[10px] text-green-600 dark:text-green-500 font-bold hidden sm:block">
                    ${dayShifts.reduce((acc, s) => acc + s.total, 0)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-col space-y-1 overflow-y-auto max-h-[80px]">
                {dayShifts.map((shift, idx) => {
                  if (shift.isIncome) {
                    return (
                      <div key={idx} className={`text-[9.5px] px-1 py-0.5 rounded bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 truncate font-bold text-center`}>
                        {shift.store}
                      </div>
                    )
                  }
                  const isBodega = shift.store.toLowerCase().includes('bodega');
                  const bgColor = isBodega ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
                  return (
                    <div key={idx} className={`text-[9.5px] px-1 py-0.5 rounded ${bgColor} border truncate font-bold text-center`}>
                      {isBodega ? 'B. Aurrera' : 'W. Cristal'}
                    </div>
                  )
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => {
           setSelectedDate(new Date());
           setIsTypeSelectorOpen(true);
        }}
        className="fixed bottom-24 right-6 p-4 bg-[#1a73e8] text-white rounded-2xl shadow-lg active:scale-95 transition-transform z-30"
      >
        <Plus size={24} />
      </button>

      {/* Day Detail Modal */}
      {isDayDetailOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-16 sm:items-center sm:pt-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[24px] shadow-2xl p-6 transform transition-all animate-in slide-in-from-top-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 capitalize">
               {format(selectedDate, 'EEEE, d MMMM', { locale: es })}
            </h3>
            <div className="space-y-3 mt-4 overflow-y-auto max-h-[50vh]">
               {getShiftsForDay(selectedDate).map(shift => {
                 const isIncome = shift.isIncome;
                 return (
                 <div key={shift.id} className="p-4 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-2xl relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-800 dark:text-gray-100">{shift.store} {isIncome && <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded ml-2">(Ingreso)</span>}</span>
                      <div className="flex space-x-2 text-gray-500">
                         <button onClick={() => isIncome ? openIncomeModal(shift) : openShiftModal(shift)} className="hover:text-blue-600 dark:hover:text-blue-400"><Edit2 size={16} /></button>
                         <button onClick={() => { deleteShift(shift.id); addToast('Eliminado', 'info'); if (getShiftsForDay(selectedDate).length === 1) setIsDayDetailOpen(false); }} className="hover:text-red-500 dark:hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {isIncome ? (
                      <div>
                         <div className="text-sm text-gray-600 dark:text-gray-300">Origen: {shift.source || 'No especificado'}</div>
                         <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-bold text-gray-900 dark:text-gray-100">
                            <span>Monto:</span>
                            <span className="text-green-600 dark:text-green-400">${shift.salary}</span>
                         </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                           <span>Nómina: ${shift.salary}</span>
                           <span>Gasolina: ${shift.gas}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-bold text-gray-900 dark:text-gray-100">
                           <span>Total Ganado:</span>
                           <span className="text-green-600 dark:text-green-400">${shift.total}</span>
                        </div>
                      </>
                    )}
                 </div>
               )})}
            </div>
            
            <div className="flex space-x-3 pt-6">
              <button 
                onClick={() => setIsDayDetailOpen(false)}
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={() => setIsTypeSelectorOpen(true)}
                className="flex-[1.5] px-4 py-3 bg-[#1a73e8] text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Añadir Otro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Type Selector Modal */}
      {isTypeSelectorOpen && selectedDate && (
         <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-16 sm:items-center sm:pt-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[24px] shadow-2xl p-6 transform transition-all animate-in slide-in-from-top-4">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">¿Qué deseas registrar?</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                     onClick={() => !hasShiftForDay(selectedDate) ? openShiftModal(null, selectedDate) : undefined}
                     className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                        hasShiftForDay(selectedDate) ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50 dark:bg-gray-800 dark:border-gray-700' : 'border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/40'
                     }`}>
                     <Briefcase size={32} className="mb-3" />
                     <span className="font-bold">Turno</span>
                     {hasShiftForDay(selectedDate) && <span className="text-[10px] text-gray-500 mt-2 text-center">Solo un turno por día</span>}
                  </button>

                  <button 
                     onClick={() => openIncomeModal(null)}
                     className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-green-100 bg-green-50/50 hover:bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-900/40 transition-all">
                     <DollarSign size={32} className="mb-3" />
                     <span className="font-bold">Ingreso</span>
                  </button>
               </div>
               <button onClick={() => setIsTypeSelectorOpen(false)} className="mt-6 w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium">Cancelar</button>
            </div>
         </div>
      )}

      {/* Add/Edit Shift Modal */}
      {isShiftModalOpen && selectedDate && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-16 sm:items-center sm:pt-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[24px] shadow-2xl p-6 transform transition-all animate-in slide-in-from-top-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{editingShiftId ? 'Editar Turno' : 'Registrar Turno'}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 capitalize">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}</p>
            
            <form onSubmit={handleSaveShift} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tienda</label>
                <div className="flex space-x-2">
                   <button
                     type="button"
                     onClick={() => setStoreName('Walmart Cristal')}
                     className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-colors ${storeName === 'Walmart Cristal' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}
                   >
                     Walmart Cristal
                   </button>
                   <button
                     type="button"
                     onClick={() => setStoreName('Bodega Aurrera')}
                     className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-colors ${storeName === 'Bodega Aurrera' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}
                   >
                     Bodega Aurrera
                   </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nómina Fija ($)</label>
                  <div className="py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-300">
                    $400
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Gasolina Fija ($)</label>
                  <div className="py-3 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-300">
                    ${storeName === 'Walmart Cristal' ? '230' : '200'}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-[#1a73e8] hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Income Modal */}
      {isIncomeModalOpen && selectedDate && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-16 sm:items-center sm:pt-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[24px] shadow-2xl p-6 transform transition-all animate-in slide-in-from-top-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{editingShiftId ? 'Editar Ingreso' : 'Registrar Ingreso'}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 capitalize">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}</p>
            
            <form onSubmit={handleSaveIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Título</label>
                <input 
                  type="text" 
                  placeholder="Ej. Bono, Venta, etc."
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                  className="w-full py-3 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full py-3 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Origen (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="¿De dónde viene este ingreso?"
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full py-3 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
