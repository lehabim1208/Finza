import React, { useState } from 'react';
import { Target, TrendingUp, Plus, Trash2, Edit2, Wallet } from 'lucide-react';
import { useAppContext, Goal } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

export default function GoalsView() {
  const { state, addGoal, updateGoalProgress, editGoal, deleteGoal } = useAppContext();
  const { addToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'savings' | 'investment'>('savings');
  
  // Form state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [account, setAccount] = useState('');

  const openForm = (goal: Goal | null = null) => {
     if (goal) {
       setEditingGoalId(goal.id);
       setTitle(goal.title);
       setTargetAmount(goal.targetAmount.toString());
       setCurrentAmount(goal.currentAmount.toString());
       setAccount(goal.account || '');
     } else {
       setEditingGoalId(null);
       setTitle('');
       setTargetAmount('');
       setCurrentAmount('');
       setAccount('');
     }
     setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && targetAmount) {
      if (editingGoalId) {
         editGoal(editingGoalId, {
            title,
            targetAmount: parseFloat(targetAmount),
            currentAmount: parseFloat(currentAmount || '0'),
            account
         });
         addToast('Actualizado', 'success');
      } else {
         addGoal({
           title,
           targetAmount: parseFloat(targetAmount),
           currentAmount: parseFloat(currentAmount || '0'),
           deadline: new Date().toISOString(),
           type: activeTab,
           account
         });
         addToast('Guardado', 'success');
      }
      setIsAddModalOpen(false);
    }
  };

  const filteredGoals = state.goals.filter(g => g.type === activeTab);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 relative text-gray-900 dark:text-gray-100">
      {/* Top Tabs */}
      <div className="flex space-x-6 px-4 pt-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto text-sm font-medium hide-scrollbar bg-white dark:bg-gray-900 shadow-sm">
        <button 
          onClick={() => setActiveTab('savings')}
          className={`pb-3 border-b-2 whitespace-nowrap flex items-center transition-colors ${activeTab === 'savings' ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
        >
          <Target size={16} className="mr-2" />
          Ahorros
        </button>
        <button 
          onClick={() => setActiveTab('investment')}
          className={`pb-3 border-b-2 whitespace-nowrap flex items-center transition-colors ${activeTab === 'investment' ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
        >
          <TrendingUp size={16} className="mr-2" />
          Inversiones
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">
        {filteredGoals.map(goal => {
          const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          return (
            <div key={goal.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
              <div className="absolute top-4 right-4 flex space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                 <button onClick={() => openForm(goal)} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-1"><Edit2 size={16}/></button>
                 <button onClick={() => { deleteGoal(goal.id); addToast('Eliminado', 'info'); }} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1"><Trash2 size={16}/></button>
              </div>

              <div className="flex justify-between items-start mb-6">
                <div className="pr-12">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center">
                    {goal.title}
                    {goal.account && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <Wallet size={10} className="mr-1" />
                        {goal.account}
                      </span>
                    )}
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Meta: ${goal.targetAmount}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#1a73e8] dark:text-blue-400 text-2xl">${goal.currentAmount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Actual</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
                <div className="bg-[#1a73e8] dark:bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                <span>{progress}% Completado</span>
                <span>Faltan: ${(goal.targetAmount - goal.currentAmount).toFixed(2)}</span>
              </div>

              {/* Quick Update */}
              <div className="mt-6 flex space-x-3">
                <button 
                  onClick={() => updateGoalProgress(goal.id, goal.currentAmount + 100)}
                  className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors rounded-xl text-sm font-semibold"
                >
                   + $100
                </button>
                <button 
                  onClick={() => updateGoalProgress(goal.id, goal.currentAmount + 500)}
                  className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors rounded-xl text-sm font-semibold"
                >
                   + $500
                </button>
              </div>
            </div>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10 text-sm">
            No hay {activeTab === 'savings' ? 'metas de ahorro' : 'inversiones'} registradas.
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => openForm(null)}
        className="fixed bottom-24 right-6 p-4 bg-[#1a73e8] text-white rounded-2xl shadow-lg active:scale-95 transition-transform z-40"
      >
        <Plus size={24} />
      </button>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pt-10 sm:pt-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[24px] shadow-2xl p-6 transform transition-all animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{editingGoalId ? 'Editar' : 'Nueva'} {activeTab === 'savings' ? 'Meta' : 'Inversión'}</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Título</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ej. Fondo de emergencia"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cuenta / Institución</label>
                <input 
                  type="text" 
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Ej. BBVA, Nu México..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto Objetivo ($)</label>
                  <input 
                    type="number" 
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="10000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ahorro Actual ($)</label>
                  <input 
                    type="number" 
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#1a73e8] text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
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
