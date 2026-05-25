import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Circle, Star, SortAsc, Plus, Calendar, Clock, DollarSign, LayoutList, Trash2, Edit2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAppContext, GenericPayment, ShoppingList } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { DatePickerModal } from '../components/DatePickerModal';

export default function TasksView() {
  const { state, addPayment, editPayment, togglePayment, deletePayment, toggleFavoritePayment, updatePaymentInstallment, addShoppingList, toggleShoppingItem, deleteShoppingList, toggleShoppingList } = useAppContext();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'pagos' | 'compras' | 'completados'>('pagos');
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'pago_simple' | 'deuda' | 'compra'>('pago_simple');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [singleDelete, setSingleDelete] = useState<{type: 'payment'|'shopping', id: string, title: string} | null>(null);

  // Simple form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Debt form state
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentsTotal, setInstallmentsTotal] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');

  // Shopping form state
  const [shoppingItems, setShoppingItems] = useState<{title: string, amount: string}[]>([{title: '', amount: ''}]);

  const shoppingTotal = useMemo(() => {
    return shoppingItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  }, [shoppingItems]);

  const handleAddShoppingItem = () => {
    setShoppingItems([...shoppingItems, {title: '', amount: ''}]);
  };

  const handleShoppingItemChange = (index: number, field: 'title' | 'amount', value: string) => {
    const newItems = [...shoppingItems];
    newItems[index][field] = value;
    setShoppingItems(newItems);
  };

  const removeShoppingItem = (index: number) => {
    const newItems = [...shoppingItems];
    newItems.splice(index, 1);
    setShoppingItems(newItems);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setNotes('');
    setDueDate('');
    setTotalAmount('');
    setInstallmentsTotal('');
    setInstallmentAmount('');
    setShoppingItems([{title: '', amount: ''}]);
  };

  const openEditModal = (type: 'pago_simple' | 'deuda' | 'compra', item: any) => {
    resetForm();
    setAddType(type);
    setEditingId(item.id);
    setTitle(item.title);
    
    if (type === 'compra') {
       if (item.items && item.items.length > 0) {
          setShoppingItems(item.items.map((i: any) => ({ title: i.title, amount: i.amount?.toString() || '' })));
       }
    } else {
       setAmount(item.amount?.toString() || '');
       setNotes(item.notes || '');
       setDueDate(item.dueDate || '');
       if (type === 'deuda') {
          setTotalAmount(item.totalAmount?.toString() || '');
          setInstallmentsTotal(item.installmentsTotal?.toString() || '');
          setInstallmentAmount(item.installmentAmount?.toString() || '');
       }
    }
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addType === 'pago_simple' && title && amount) {
      if (editingId) {
        editPayment(editingId, {
          title,
          amount: parseFloat(amount),
          dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
          notes
        });
        addToast('Pago actualizado', 'success');
      } else {
        addPayment({
          type: 'simple',
          title,
          amount: parseFloat(amount),
          dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
          isCompleted: false,
          notes
        });
        addToast('Pago agregado exitosamente', 'success');
      }
    } else if (addType === 'deuda' && title && amount && totalAmount && installmentsTotal) {
      if (editingId) {
        editPayment(editingId, {
          title,
          amount: parseFloat(amount),
          totalAmount: parseFloat(totalAmount),
          installmentAmount: parseFloat(installmentAmount || amount),
          installmentsTotal: parseInt(installmentsTotal, 10),
          dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
          notes
        });
        addToast('Deuda actualizada', 'success');
      } else {
        addPayment({
          type: 'debt',
          title,
          amount: parseFloat(amount),
          totalAmount: parseFloat(totalAmount),
          installmentAmount: parseFloat(installmentAmount || amount),
          installmentsTotal: parseInt(installmentsTotal, 10),
          installmentsPaid: 0,
          dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
          isCompleted: false,
          notes
        });
        addToast('Deuda/Plazos agregado', 'success');
      }
    } else if (addType === 'compra' && title) {
      const validItems = shoppingItems.filter(i => i.title.trim() !== '');
      if (editingId) {
         deleteShoppingList(editingId);
         addShoppingList({
            title,
            items: validItems.map(n => ({ id: Math.random().toString(), title: n.title.trim(), amount: parseFloat(n.amount) || 0, isCompleted: false })),
            isCompleted: false
         });
         addToast('Lista actualizada', 'success');
      } else {
        addShoppingList({
          title,
          items: validItems.map(n => ({ id: Math.random().toString(), title: n.title.trim(), amount: parseFloat(n.amount) || 0, isCompleted: false })),
          isCompleted: false
        });
        addToast('Lista de compras guardada', 'success');
      }
    }
    
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleRecover = (type: 'payment' | 'shopping', id: string) => {
     if (type === 'payment') togglePayment(id);
     else toggleShoppingList(id);
     addToast('Recuperado con éxito', 'success');
  };

  const handleDeleteAllCompleted = () => {
    completedPayments.forEach(p => deletePayment(p.id));
    completedShoppingLists.forEach(s => deleteShoppingList(s.id));
    setConfirmDeleteAllOpen(false);
    addToast('Datos completados eliminados', 'success');
  };

  const activePayments = state.payments.filter(p => !p.isCompleted);
  const completedPayments = state.payments.filter(p => p.isCompleted);
  const activeShoppingLists = state.shoppingLists.filter(s => !s.isCompleted);
  const completedShoppingLists = state.shoppingLists.filter(s => s.isCompleted);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 relative text-gray-900 dark:text-gray-100">
      {/* Top Tabs */}
      <div className="flex space-x-6 px-4 pt-4 border-b border-gray-200 dark:border-gray-800 overflow-x-auto text-sm font-medium hide-scrollbar bg-white dark:bg-gray-900">
        <button 
          onClick={() => setActiveTab('compras')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'compras' ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
        >
          Compras <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-1.5 rounded-full ml-1">{activeShoppingLists.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('pagos')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'pagos' ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
        >
          Pagos
        </button>
        <button 
          onClick={() => setActiveTab('completados')}
          className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'completados' ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
        >
          Completados
        </button>
      </div>

      {/* Header controls */}
      {activeTab === 'pagos' && (
        <div className="px-4 py-3 flex justify-between items-center text-xl font-bold bg-white dark:bg-gray-900">
          <span className="text-gray-800 dark:text-gray-100">Pagos</span>
          <div className="flex space-x-4 text-gray-400 dark:text-gray-500">
            <SortAsc size={20} />
            <span className="font-serif text-lg tracking-widest leading-none rotate-90">...</span>
          </div>
        </div>
      )}

      {/* Content list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {activeTab === 'pagos' && (
          <div className="space-y-1 mt-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 shadow-sm">
            {activePayments.map(payment => (
              <div key={payment.id} className="flex flex-col space-y-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 group cursor-pointer">
                <div className="flex items-start space-x-3">
                  <button onClick={() => { togglePayment(payment.id); addToast('Pago actualizado', 'success'); }} className="mt-1 flex-shrink-0 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                    <Circle size={22} />
                  </button>
                  <div className="flex-1 pr-4">
                    <div className="text-[15px] font-medium leading-snug text-gray-800 dark:text-gray-100">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 -translate-y-px ${payment.type === 'debt' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                      {payment.type === 'debt' ? 'Deuda:' : 'Pago:'} {payment.title}
                    </div>
                    {payment.type === 'debt' && payment.totalAmount && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-col">
                        <div className="flex items-center">
                           <DollarSign size={10} className="text-gray-400 dark:text-gray-500 mr-1" />
                           Total deuda: ${payment.totalAmount} | Por mes: ${payment.installmentAmount}
                        </div>
                        <div className="flex items-center mt-1 font-medium text-blue-700 dark:text-blue-400">
                          Restante: ${(payment.totalAmount - ((payment.installmentsPaid || 0) * (payment.installmentAmount || 0))).toFixed(2)}
                        </div>
                      </div>
                    )}
                    {payment.type !== 'debt' && payment.amount && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <DollarSign size={10} className="text-gray-400 dark:text-gray-500 mr-1" />
                        Monto: ${payment.amount}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center font-medium justify-between">
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1.5 hidden" />
                        Próximo: {format(new Date(payment.dueDate), "EEE d 'de' MMM, h a", { locale: es })}
                      </div>
                      <div className="flex items-center space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); openEditModal(payment.type === 'debt' ? 'deuda' : 'pago_simple', payment); }} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Edit2 size={14}/></button>
                         <button onClick={(e) => { e.stopPropagation(); deletePayment(payment.id); addToast('Eliminado', 'info'); }} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleFavoritePayment(payment.id)} className="flex-shrink-0 p-1">
                    <Star size={20} className={payment.isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300 dark:text-gray-600'} />
                  </button>
                </div>

                {/* Installments Progress Bar and Checkboxes */}
                {payment.type === 'debt' && payment.installmentsTotal && (
                   <div className="pl-9 pr-2">
                     <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
                       <span>Progreso: {payment.installmentsPaid} de {payment.installmentsTotal} meses</span>
                     </div>
                     <div className="flex flex-wrap gap-1">
                       {Array.from({ length: payment.installmentsTotal }).map((_, i) => (
                          <div 
                            key={i} 
                            onClick={async () => {}}
                            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] border cursor-pointer
                              ${i < (payment.installmentsPaid || 0) 
                                ? 'bg-[#1a73e8] border-[#1a73e8] text-white' 
                                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-blue-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500 dark:hover:border-blue-600'}`}
                          >
                           {i + 1}
                          </div>
                       ))}
                     </div>
                     <div className="mt-2 flex space-x-2">
                        <button onClick={() => updatePaymentInstallment(payment.id, true)}
                           className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                           disabled={payment.installmentsPaid === payment.installmentsTotal}>
                          + Marcar Mes
                        </button>
                        <button onClick={() => updatePaymentInstallment(payment.id, false)}
                           className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded font-medium hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                           disabled={!payment.installmentsPaid}>
                          - Desmarcar
                        </button>
                     </div>
                   </div>
                )}
              </div>
            ))}
            {state.payments.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 mt-10 text-sm pb-10">No hay pagos registrados</div>}
          </div>
        )}

        {activeTab === 'compras' && (
          <div className="space-y-4 mt-4">
            {activeShoppingLists.map(list => (
              <div key={list.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm relative group">
                <div className="absolute top-4 right-4 flex space-x-2 text-gray-300 dark:text-gray-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                   <button onClick={() => openEditModal('compra', list)} className="hover:text-blue-500 dark:hover:text-blue-400">
                      <Edit2 size={18} />
                   </button>
                   <button onClick={() => { deleteShoppingList(list.id); addToast('Lista eliminada', 'info'); }} className="hover:text-red-500 dark:hover:text-red-400">
                      <Trash2 size={18} />
                   </button>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 pr-16">{list.title}</h3>
                <div className="space-y-3">
                  {list.items.map(item => (
                    <div key={item.id} className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                      <button onClick={() => { toggleShoppingItem(list.id, item.id); }}>
                         {item.isCompleted ? <CheckCircle2 size={18} className="text-[#1a73e8]" /> : <Circle size={18} className="text-gray-300 dark:text-gray-600" />}
                      </button>
                      <div className={`flex flex-col ${item.isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                         <span>- {item.title}</span>
                         {item.amount && <span className="text-[10px] text-green-600 dark:text-green-500 font-medium">${item.amount}</span>}
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                     <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total aprox:</span>
                     <span className="font-bold text-gray-900 dark:text-gray-100">${list.items.reduce((acc, i) => acc + (i.amount || 0), 0)}</span>
                  </div>
                  <button 
                     onClick={() => { toggleShoppingList(list.id); addToast('Lista completada', 'success') }}
                     className="mt-3 w-full py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                     Marcar Lista como Completada
                  </button>
                </div>
              </div>
            ))}
            {activeShoppingLists.length === 0 && <div className="text-center text-gray-500 dark:text-gray-400 mt-10 text-sm">No hay listas de compras activas</div>}
          </div>
        )}

        {activeTab === 'completados' && (
          <div className="space-y-6 mt-4 pb-12">
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex items-start space-x-3 text-sm text-blue-800 dark:text-blue-300">
               <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
               <p>Los datos completados se mantendrán por 15 días, posteriormente se eliminarán automáticamente y no se pueden recuperar.</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Pagos Completados</h3>
              {completedPayments.length === 0 ? <p className="text-sm text-gray-400 dark:text-gray-500 px-2">No hay pagos completados recientes</p> : (
                 <div className="space-y-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 shadow-sm opacity-80">
                   {completedPayments.map(p => (
                     <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-700 last:border-0 px-2 group">
                       <span className="text-gray-500 dark:text-gray-400 line-through text-[15px]">{p.title}</span>
                       <div className="flex space-x-2">
                          <button onClick={() => handleRecover('payment', p.id)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1"><RotateCcw size={18}/></button>
                          <button onClick={() => setSingleDelete({type: 'payment', id: p.id, title: p.title})} className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 p-1"><Trash2 size={18}/></button>
                       </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Compras Completadas</h3>
              {completedShoppingLists.length === 0 ? <p className="text-sm text-gray-400 dark:text-gray-500 px-2">No hay listas completadas recientes</p> : (
                 <div className="space-y-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 shadow-sm opacity-80">
                   {completedShoppingLists.map(l => (
                     <div key={l.id} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-700 last:border-0 px-2 group">
                       <span className="text-gray-500 dark:text-gray-400 line-through text-[15px]">{l.title}</span>
                       <div className="flex space-x-2">
                          <button onClick={() => handleRecover('shopping', l.id)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1"><RotateCcw size={18}/></button>
                          <button onClick={() => setSingleDelete({type: 'shopping', id: l.id, title: l.title})} className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 p-1"><Trash2 size={18}/></button>
                       </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>

            {(completedPayments.length > 0 || completedShoppingLists.length > 0) && (
               <div className="pt-6">
                  <button onClick={() => setConfirmDeleteAllOpen(true)} className="w-full py-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold rounded-xl border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                     Borrar datos definitivamente
                  </button>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {activeTab !== 'completados' && (
         <button 
         onClick={() => {
            resetForm();
            setAddType(activeTab === 'pagos' ? 'pago_simple' : 'compra');
            setIsAddModalOpen(true);
         }}
         className="fixed bottom-24 right-6 p-4 bg-[#1a73e8] text-white rounded-2xl shadow-lg active:scale-95 transition-transform z-30"
         >
         <Plus size={24} />
         </button>
      )}

      {/* Delete All Confirm Modal */}
      {confirmDeleteAllOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[24px] shadow-2xl p-6 text-center">
               <h3 className="text-xl font-bold mb-2 dark:text-white text-gray-900">¿Borrar todo lo completado?</h3>
               <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Esta acción es permanente y no se puede deshacer.</p>
               <div className="flex space-x-3">
                  <button onClick={() => setConfirmDeleteAllOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium">Cancelar</button>
                  <button onClick={handleDeleteAllCompleted} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium">Borrar</button>
               </div>
            </div>
         </div>
      )}

      {/* Single Delete Confirm Modal */}
      {singleDelete && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[24px] shadow-2xl p-6 text-center animate-in zoom-in-95">
               <h3 className="text-xl font-bold mb-2 dark:text-white text-gray-900">¿Eliminar '{singleDelete.title}'?</h3>
               <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Esta acción es permanente y no se puede deshacer.</p>
               <div className="flex space-x-3">
                  <button onClick={() => setSingleDelete(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium">Cancelar</button>
                  <button onClick={() => {
                     if (singleDelete.type === 'payment') deletePayment(singleDelete.id);
                     else deleteShoppingList(singleDelete.id);
                     addToast('Eliminado', 'info');
                     setSingleDelete(null);
                  }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium">Borrar</button>
               </div>
            </div>
         </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 pt-10 sm:pt-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md md:max-w-xl rounded-[24px] p-6 transform transition-all animate-in zoom-in-95 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
               {editingId ? 'Editar' : 'Agregar'} {addType === 'compra' ? 'Lista de Compras' : (addType === 'deuda' ? 'Deuda a Plazos' : 'Pago Simple')}
            </h3>

            {activeTab === 'pagos' && !editingId && (
              <div className="flex space-x-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                 <button 
                  onClick={() => setAddType('pago_simple')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${addType === 'pago_simple' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                 >Simple</button>
                 <button 
                  onClick={() => setAddType('deuda')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${addType === 'deuda' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                 >Deuda/Plazos</button>
              </div>
            )}
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Título</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={addType === 'compra' ? "Ej. Compras despensa" : "Ej. Gasolinas"}
                  required
                />
              </div>

              {addType === 'compra' && (
                 <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Artículos (Aprox.)</label>
                    <div className="space-y-2">
                       {shoppingItems.map((item, idx) => (
                          <div key={idx} className="flex space-x-2 relative group">
                             <input 
                                type="text"
                                value={item.title}
                                onChange={e => handleShoppingItemChange(idx, 'title', e.target.value)}
                                className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none"
                                placeholder="Artículo"
                                required
                             />
                             <div className="w-24 shrink-0 flex space-x-1 items-center">
                                <span className="text-gray-400">$</span>
                                <input 
                                   type="number"
                                   value={item.amount}
                                   onChange={e => handleShoppingItemChange(idx, 'amount', e.target.value)}
                                   className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none text-center"
                                   placeholder="0"
                                />
                             </div>
                             <div className="w-8 shrink-0 flex items-center justify-center">
                                {shoppingItems.length > 1 && (
                                   <button type="button" onClick={() => removeShoppingItem(idx)} className="text-red-400 hover:text-red-600 p-1.5 opacity-70 hover:opacity-100 transition-opacity">
                                      <Trash2 size={18} />
                                   </button>
                                )}
                             </div>
                          </div>
                       ))}
                    </div>
                    <button type="button" onClick={handleAddShoppingItem} className="mt-3 flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg w-full justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50">
                       <Plus size={16} /> <span>Agregar campo</span>
                    </button>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-lg">
                       <span className="font-medium text-gray-600 dark:text-gray-300">Total aproximado:</span>
                       <span className="font-bold text-gray-900 dark:text-white">${shoppingTotal.toFixed(2)}</span>
                    </div>
                 </div>
              )}

              {addType === 'deuda' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Deuda ($)</label>
                       <input 
                         type="number" 
                         value={totalAmount}
                         onChange={e => setTotalAmount(e.target.value)}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cant. Meses</label>
                       <input 
                         type="number" 
                         value={installmentsTotal}
                         onChange={e => setInstallmentsTotal(e.target.value)}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
                         required
                       />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                     <div>
                       <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Costo / Mes ($)</label>
                       <input 
                         type="number" 
                         value={installmentAmount}
                         onChange={e => {
                            setInstallmentAmount(e.target.value);
                            setAmount(e.target.value); // Sync to base amount
                         }}
                         className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
                         required
                       />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha</label>
                        <button
                          type="button"
                          onClick={() => setIsDatePickerOpen(true)}
                          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-left text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 flex justify-between items-center text-sm"
                        >
                          <span className="truncate mr-1">{dueDate ? format(new Date(dueDate), "d MMM yyyy", { locale: es }) : 'Seleccionar'}</span>
                          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                        </button>
                     </div>
                  </div>
                </>
              )}

              {addType === 'pago_simple' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto ($)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha de Pago</label>
                      <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(true)}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-left text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 flex justify-between items-center"
                      >
                        <span className="truncate mr-2">{dueDate ? format(new Date(dueDate), "EEE d MMM yy", { locale: es }) : 'Seleccionar fecha'}</span>
                        <Calendar size={18} className="text-gray-400 flex-shrink-0" />
                      </button>
                  </div>
                </div>
              )}

              {addType !== 'compra' && (
                 <div>
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notas / Detalles</label>
                   <textarea 
                     value={notes}
                     onChange={e => setNotes(e.target.value)}
                     className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white h-24 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                     placeholder={"Detalles del pago..."}
                   ></textarea>
                 </div>
              )}

              <div className="flex space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3.5 bg-[#1a73e8] text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Date Picker Modal */}
      <DatePickerModal 
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={(date) => setDueDate(date)}
        initialDate={dueDate}
      />
    </div>
  );
}
