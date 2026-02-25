/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  FileText, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  Save,
  User,
  Plus,
  Minus
} from 'lucide-react';
import { ItemCategory, ChecklistItem, ChecklistData } from './types';
import { SignaturePad } from './components/SignaturePad';
import { generatePDF, savePDFToServer } from './services/pdfService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_ITEMS: ChecklistItem[] = [
  { id: '1', name: 'Case Completo (35 unid)', category: ItemCategory.COMPUTERS, expectedQuantity: 35, currentQuantity: 35, isComplete: true },
  { id: '2', name: 'Projetor', category: ItemCategory.PERIPHERALS, expectedQuantity: 1, currentQuantity: 1, isComplete: true },
  { id: '3', name: 'Notebook', category: ItemCategory.PERIPHERALS, expectedQuantity: 1, currentQuantity: 1, isComplete: true },
  { id: '4', name: 'Extensão', category: ItemCategory.PERIPHERALS, expectedQuantity: 1, currentQuantity: 1, isComplete: true },
  { id: '5', name: 'Cabo HDMI', category: ItemCategory.CABLES, expectedQuantity: 1, currentQuantity: 1, isComplete: true },
  { id: '6', name: 'Adaptador HDMI', category: ItemCategory.CABLES, expectedQuantity: 1, currentQuantity: 1, isComplete: true },
  { id: '7', name: 'Cabo de Força', category: ItemCategory.CABLES, expectedQuantity: 1, currentQuantity: 1, isComplete: true },
];

export default function App() {
  const [teacherName, setTeacherName] = useState('');
  const [usageStartTime, setUsageStartTime] = useState('');
  const [usageEndTime, setUsageEndTime] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_ITEMS);
  const [justification, setJustification] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [history, setHistory] = useState<{ name: string; date: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentChecklistData, setCurrentChecklistData] = useState<ChecklistData | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.currentQuantity + delta);
        return { ...item, currentQuantity: newQty };
      }
      return item;
    }));
  };

  const handleManualQuantity = (id: string, value: string) => {
    const qty = parseInt(value) || 0;
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, currentQuantity: qty } : item
    ));
  };

  const hasDiscrepancy = items.some(item => item.currentQuantity !== item.expectedQuantity);
  const isValid = teacherName.length > 0 && signature !== null && (!hasDiscrepancy || justification.length > 10);

  const handlePreview = async () => {
    if (!isValid) return;
    
    const checklistData: ChecklistData = {
      id: Date.now().toString(),
      teacherName,
      date: new Date().toISOString(),
      usageStartTime,
      usageEndTime,
      items,
      justification: hasDiscrepancy ? justification : undefined,
      signature: signature || undefined,
      status: 'completed'
    };

    setCurrentChecklistData(checklistData);
    const doc = await generatePDF(checklistData);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  };

  const handleSubmit = async () => {
    if (!currentChecklistData) return;
    setIsSubmitting(true);

    try {
      const doc = await generatePDF(currentChecklistData);
      await savePDFToServer(doc, currentChecklistData.teacherName);
      doc.save(`checklist_${currentChecklistData.teacherName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      
      // Reset form
      setTeacherName('');
      setUsageStartTime('');
      setUsageEndTime('');
      setItems(INITIAL_ITEMS);
      setJustification('');
      setSignature(null);
      setPreviewUrl(null);
      setCurrentChecklistData(null);
      fetchHistory();
      alert('Checklist enviado e PDF gerado com sucesso!');
    } catch (error) {
      alert('Erro ao processar o checklist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ClipboardCheck className="text-indigo-600" size={32} />
              EduCheck
            </h1>
            <p className="text-zinc-500 mt-1">Controle de Materiais Pedagógicos</p>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-all text-sm font-medium"
          >
            <History size={18} />
            {showHistory ? 'Voltar ao Form' : 'Ver Histórico'}
          </button>
        </header>

        <AnimatePresence mode="wait">
          {!showHistory ? (
            <motion.main
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Teacher Info & Time */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <div className="flex items-center gap-2 mb-4 text-indigo-600 font-semibold">
                  <User size={20} />
                  <h2>Identificação e Período</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Nome do Professor</label>
                    <input 
                      type="text" 
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Horário de Início</label>
                    <input 
                      type="time" 
                      value={usageStartTime}
                      onChange={(e) => setUsageStartTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Horário de Devolução</label>
                    <input 
                      type="time" 
                      value={usageEndTime}
                      onChange={(e) => setUsageEndTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Checklist Categories */}
              {Object.values(ItemCategory).map(category => (
                <section key={category} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{category}</h3>
                  <div className="divide-y divide-zinc-50">
                    {items.filter(i => i.category === category).map(item => (
                      <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-zinc-800">{item.name}</p>
                          <p className="text-xs text-zinc-400">Esperado: {item.expectedQuantity} unid.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <input 
                            type="number" 
                            value={item.currentQuantity}
                            onChange={(e) => handleManualQuantity(item.id, e.target.value)}
                            className={cn(
                              "w-16 text-center py-2 rounded-lg border font-bold",
                              item.currentQuantity === item.expectedQuantity 
                                ? "border-emerald-100 bg-emerald-50 text-emerald-700" 
                                : "border-amber-100 bg-amber-50 text-amber-700"
                            )}
                          />
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              {/* Validation & Justification */}
              {hasDiscrepancy && (
                <motion.section 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-amber-50 p-6 rounded-2xl border border-amber-100"
                >
                  <div className="flex items-center gap-2 mb-3 text-amber-700 font-semibold">
                    <AlertCircle size={20} />
                    <h2>Divergência Detectada</h2>
                  </div>
                  <p className="text-sm text-amber-600 mb-4">
                    A quantidade atual difere da esperada. Por favor, justifique a ocorrência para prosseguir.
                  </p>
                  <textarea 
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Descreva o motivo da divergência (ex: cabo danificado, item em manutenção...)"
                    className="w-full p-4 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 outline-none h-32 resize-none"
                  />
                </motion.section>
              )}

              {/* Signature */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <SignaturePad 
                  onSave={(sig) => setSignature(sig)} 
                  onClear={() => setSignature(null)} 
                />
              </section>

              {/* Action */}
              <div className="pt-4">
                <button
                  disabled={!isValid || isSubmitting}
                  onClick={handlePreview}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                    isValid && !isSubmitting
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98]"
                      : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                  )}
                >
                  <FileText size={22} />
                  Visualizar Comprovante
                </button>
                {!isValid && teacherName && (
                  <p className="text-center text-xs text-zinc-400 mt-4">
                    {!signature ? "Assinatura obrigatória" : hasDiscrepancy && justification.length <= 10 ? "Justificativa muito curta" : ""}
                  </p>
                )}
              </div>

              {/* PDF Preview Modal */}
              <AnimatePresence>
                {previewUrl && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
                    >
                      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                        <h2 className="text-xl font-bold text-zinc-800">Visualização do Comprovante</h2>
                        <button 
                          onClick={() => setPreviewUrl(null)}
                          className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                        >
                          <Plus className="rotate-45" size={24} />
                        </button>
                      </div>
                      <div className="flex-1 bg-zinc-200 p-4">
                        <iframe 
                          src={previewUrl} 
                          className="w-full h-full rounded-xl border-none shadow-inner"
                          title="PDF Preview"
                        />
                      </div>
                      <div className="p-6 border-t border-zinc-100 flex gap-4">
                        <button 
                          onClick={() => setPreviewUrl(null)}
                          className="flex-1 py-3 px-6 rounded-xl border border-zinc-200 font-semibold text-zinc-600 hover:bg-zinc-50 transition-all"
                        >
                          Voltar e Editar
                        </button>
                        <button 
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Save size={20} />
                              Confirmar e Salvar
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.main>
          ) : (
            <motion.main
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden"
            >
              <div className="p-6 border-bottom border-zinc-100 bg-zinc-50">
                <h2 className="font-bold text-zinc-800">Histórico de Comprovantes</h2>
              </div>
              <div className="divide-y divide-zinc-100">
                {history.length > 0 ? history.map((file, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-800 truncate max-w-[200px] md:max-w-md">
                          {file.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(file.date).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors">
                      <Download size={20} />
                    </button>
                  </div>
                )) : (
                  <div className="p-12 text-center text-zinc-400">
                    Nenhum registro encontrado.
                  </div>
                )}
              </div>
            </motion.main>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <footer className="mt-12 text-center text-zinc-400 text-sm pb-8">
          <p>© 2024 EduCheck System • Gestão de Inventário Escolar</p>
        </footer>
      </div>
    </div>
  );
}
