import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getYear, getMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Repeat } from 'lucide-react';

interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  initialDate?: string;
}

export const DatePickerModal: React.FC<DatePickerProps> = ({ isOpen, onClose, onSelect, initialDate }) => {
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date());
  
  if (!isOpen) return null;

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const handleSelectDate = (date: Date) => {
    // Keep current time, just update the date
    const d = new Date(currentDate);
    d.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    onSelect(d.toISOString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[24px] p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div className="text-lg font-medium text-gray-900 dark:text-white capitalize">
            {format(currentDate, "MMMM 'de' yyyy", { locale: es })}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ChevronRight size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 mb-2">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dayName, idx) => (
            <div key={idx} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, idx) => {
            const isSelected = isSameDay(day, currentDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDate(day)}
                className={`
                  w-10 h-10 mx-auto flex items-center justify-center rounded-full text-sm transition-colors
                  ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}
                  ${isSelected ? 'bg-[#1a73e8] text-white font-bold shadow-md' : (isCurrentMonth ? 'hover:bg-blue-50 hover:text-[#1a73e8] dark:hover:bg-blue-900/30' : '')}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        {/* Bottom Options */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-1 hidden">
          <button className="flex items-center w-full px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-sm text-gray-700 dark:text-gray-300">
            <Clock size={18} className="mr-3 text-gray-400 dark:text-gray-500" />
            Establecer hora
          </button>
          <button className="flex items-center w-full px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-sm text-gray-700 dark:text-gray-300">
            <Repeat size={18} className="mr-3 text-gray-400 dark:text-gray-500" />
            Repetir
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-4 px-2 space-x-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            Cancelar
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#1a73e8] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
