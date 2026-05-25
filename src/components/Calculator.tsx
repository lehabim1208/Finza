import React, { useState } from "react";
import { evaluate } from "mathjs"; // Need to use native evaluation or simple parse
import { useAppContext } from "../context/AppContext";
import { X, Delete, Clock, Trash2, History } from "lucide-react";

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const { state, addCalcHistory, clearCalcHistory } = useAppContext();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const history = state.calculatorHistory || [];

  const handleInput = (val: string) => {
    setExpression((prev) => prev + val);
    try {
      // Basic safe evaluation, could be improved.
      // We will define a simple math evaluator
      const safeEval = new Function(
        "return " + (expression + val).replace(/%/g, '/100').replace(/[^-()\d/*+.]/g, ""),
      );
      setResult(safeEval() + "");
    } catch (e) {
      // Ignore
    }
  };

  const handleClear = () => {
    setExpression("");
    setResult("");
  };

  const handleDelete = () => {
    setExpression((prev) => prev.slice(0, -1));
    try {
      const newExp = expression.slice(0, -1);
      if (!newExp) {
        setResult("");
      } else {
        const safeEval = new Function(
          "return " + newExp.replace(/%/g, '/100').replace(/[^-()\d/*+.]/g, ""),
        );
        setResult(safeEval() + "");
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleCalculate = () => {
    try {
      if (!expression) return;
      const safeEval = new Function(
        "return " + expression.replace(/%/g, '/100').replace(/[^-()\d/*+.]/g, ""),
      );
      const res = safeEval();
      addCalcHistory({ expression, result: res.toString() });
      setExpression(res.toString());
      setResult("");
    } catch (e) {
      setResult("Error");
    }
  };

  const buttons = [
    { label: "C", action: handleClear, color: "text-red-500" },
    { label: "(", action: () => handleInput("("), color: "text-[#1a73e8]" },
    { label: ")", action: () => handleInput(")"), color: "text-[#1a73e8]" },
    { label: "÷", action: () => handleInput("/"), color: "text-[#1a73e8]" },
    { label: "7", action: () => handleInput("7") },
    { label: "8", action: () => handleInput("8") },
    { label: "9", action: () => handleInput("9") },
    { label: "×", action: () => handleInput("*"), color: "text-[#1a73e8]" },
    { label: "4", action: () => handleInput("4") },
    { label: "5", action: () => handleInput("5") },
    { label: "6", action: () => handleInput("6") },
    { label: "-", action: () => handleInput("-"), color: "text-[#1a73e8]" },
    { label: "1", action: () => handleInput("1") },
    { label: "2", action: () => handleInput("2") },
    { label: "3", action: () => handleInput("3") },
    { label: "+", action: () => handleInput("+"), color: "text-[#1a73e8]" },
    { label: "%", action: () => handleInput("%"), color: "text-[#1a73e8]" },
    { label: "0", action: () => handleInput("0") },
    { label: ".", action: () => handleInput(".") },
    {
      label: "=",
      action: handleCalculate,
      color: "bg-[#1a73e8] text-white",
      isBg: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 w-full md:max-w-sm h-[85vh] sm:h-auto sm:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-xl transition-colors ${showHistory ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <History size={20} />
            </button>
          </div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
            Calculadora
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-gray-500 uppercase">
                  Historial
                </h4>
                {history.length > 0 && (
                  <button
                    onClick={clearCalcHistory}
                    className="text-red-500 text-sm flex items-center space-x-1 hover:text-red-600"
                  >
                    <Trash2 size={14} /> <span>Borrar</span>
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-10">
                  No hay operaciones recientes
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="text-right border-b border-gray-50 dark:border-gray-800 pb-2"
                  >
                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      {item.expression}
                    </div>
                    <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      ={item.result}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Display */}
              <div className="flex-none p-6 flex flex-col justify-end bg-gray-50 dark:bg-gray-800 min-h-[140px] relative">
                <button
                  onClick={handleDelete}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Delete size={24} />
                </button>
                <div className="text-gray-500 dark:text-gray-400 text-lg w-full text-right break-all min-h-[28px]">
                  {expression}
                </div>
                <div className="text-4xl font-bold w-full text-right text-gray-900 dark:text-white truncate">
                  {result ? `=${result}` : "0"}
                </div>
              </div>

              {/* Keypad */}
              <div className="flex-1 p-6 bg-white dark:bg-gray-900 grid grid-cols-4 gap-3 sm:gap-4 place-items-stretch">
                {buttons.map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className={`
                           flex items-center justify-center text-2xl font-medium rounded-2xl transition-all active:scale-95
                           ${btn.isBg ? btn.color : `bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${btn.color || "text-gray-800 dark:text-white"}`}
                           ${btn.colSpan ? `col-span-${btn.colSpan}` : ""}
                         `}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
