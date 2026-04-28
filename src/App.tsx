/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Copy, 
  Settings2, 
  Activity, 
  CheckCircle2, 
  Circle, 
  ExternalLink,
  RefreshCw,
  Eye,
  Type as TypeIcon,
  Palette,
  Layout
} from 'lucide-react';
import { 
  VectorType, 
  Fidelity, 
  TypographyPreference, 
  ColorPreference, 
  GeometryPreference, 
  VectorizationState,
  AnalysisResult,
  GeometricSystem
} from './types';
import { GeminiService } from './services/gemini';
import { CompareSlider } from './components/CompareSlider';

const INITIAL_STATE: VectorizationState = {
  image: null,
  step: 1,
  analysis: null,
  geometricSystem: null,
  svgBase: null,
  svgFinal: null,
  settings: {
    fidelity: Fidelity.HIGH,
    typography: TypographyPreference.FIDELITY,
    color: ColorPreference.KEEP_GRADIENTS,
    geometry: GeometryPreference.FORCE_MATHEMATICAL,
  },
  progress: {
    analysis: 'idle',
    structure: 'idle',
    svgBase: 'idle',
    color: 'idle',
  }
};

export default function App() {
  const [state, setState] = useState<VectorizationState>({
    ...INITIAL_STATE,
    settings: {
      ...INITIAL_STATE.settings,
      precisionMode: false,
    },
    progress: {
      ...INITIAL_STATE.progress,
      refinement: 'idle',
    }
  });

  const runRefinement = async () => {
    if (!state.image || !state.svgFinal || !state.analysis) return;
    setState(prev => ({ ...prev, progress: { ...prev.progress, refinement: 'loading' } }));
    try {
      const refined = await GeminiService.refineSVG(state.image, state.svgFinal, state.analysis);
      setState(prev => ({ 
        ...prev, 
        svgRefined: refined, 
        svgFinal: refined, // We overwrite the final with the refined one
        progress: { ...prev.progress, refinement: 'done' } 
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, progress: { ...prev.progress, refinement: 'error' } }));
    }
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setState(prev => ({ 
          ...prev, 
          image: ev.target?.result as string,
          step: 2,
          svgRefined: null,
          svgFinal: null,
          svgBase: null,
          geometricSystem: null,
          analysis: null
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const runAnalysis = async () => {
    if (!state.image) return;
    setState(prev => ({ ...prev, progress: { ...prev.progress, analysis: 'loading' } }));
    try {
      const analysis = await GeminiService.analyzeImage(state.image);
      setState(prev => ({ 
        ...prev, 
        analysis, 
        progress: { ...prev.progress, analysis: 'done' },
        step: 3
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, progress: { ...prev.progress, analysis: 'error' } }));
    }
  };

  const runGeneration = async () => {
    if (!state.image || !state.analysis) return;
    setState(prev => ({ 
      ...prev, 
      step: 5,
      progress: { ...prev.progress, structure: 'loading', svgBase: 'idle', color: 'idle' } 
    }));

    try {
      // Phase 1: Structure
      const system = await GeminiService.generateGeometricSystem(state.image, state.analysis);
      setState(prev => ({ ...prev, geometricSystem: system, progress: { ...prev.progress, structure: 'done', svgBase: 'loading' } }));
      
      // Phase 2: SVG Base
      const svgBase = await GeminiService.generateSVGBase(state.image, system, state.settings);
      setState(prev => ({ ...prev, svgBase: svgBase, progress: { ...prev.progress, svgBase: 'done', color: 'loading' } }));
      
      // Phase 3: Color
      const svgFinal = await GeminiService.applyColor(state.image, svgBase, state.analysis);
      setState(prev => ({ ...prev, svgFinal: svgFinal, progress: { ...prev.progress, color: 'done' }, step: 6 }));
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = () => {
    if (state.svgFinal) {
      navigator.clipboard.writeText(state.svgFinal);
      alert('Código SVG copiado al portapapeles');
    }
  };

  const downloadSVG = () => {
    if (state.svgFinal) {
      const svgWithHeader = state.svgFinal.startsWith('<?xml') 
        ? state.svgFinal 
        : `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${state.svgFinal}`;
      
      const blob = new Blob([svgWithHeader], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vector-export-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* HEADER */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0] sticky top-0 z-50">
        <div>
          <h1 className="text-2xl font-serif italic font-bold tracking-tight">Vectorizador SVG Asistido por IA</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Convierte imágenes en SVG editables con control estructural</p>
        </div>
        <div className="flex gap-4">
          {state.step > 1 && (
            <button 
              onClick={() => setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }))}
              className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {state.image && (
            <button 
              onClick={() => setState(INITIAL_STATE)}
              className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors flex items-center gap-2 text-xs font-mono"
            >
              <RefreshCw size={14} /> NEW
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {state.step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#141414]/20 rounded-3xl"
            >
              <div className="w-20 h-20 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center mb-6">
                <Upload size={32} />
              </div>
              <h2 className="text-3xl font-serif italic mb-4">Sube tu imagen</h2>
              <p className="text-center text-[#141414]/60 max-w-md mb-8">
                Formatos soportados: PNG, JPG, WebP. Resolución mínima recomendada 512px.
              </p>
              <label className="px-8 py-4 bg-[#141414] text-[#E4E3E0] font-mono text-sm tracking-widest cursor-pointer hover:bg-opacity-80 transition-all uppercase">
                Seleccionar archivo
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              </label>
            </motion.div>
          )}

          {/* STEP 2: CLASSIFICATION */}
          {state.step === 2 && state.image && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12"
            >
              <div className="aspect-square bg-[#151619] rounded-3xl p-8 overflow-hidden shadow-2xl">
                <img src={state.image} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col justify-center gap-8">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-widest opacity-50">Step 02 / Clasificación</span>
                  <h2 className="text-4xl font-serif italic">Configura el motor</h2>
                </div>
                
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-[10px] uppercase font-mono tracking-widest block mb-2">Tipo de Vectorización</span>
                    <select 
                      className="w-full bg-transparent border-b border-[#141414] py-2 focus:outline-none font-serif italic text-xl"
                      value={state.analysis?.compositionType || VectorType.MIXED}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        analysis: { ...(prev.analysis as AnalysisResult), compositionType: e.target.value as VectorType } 
                      }))}
                    >
                      {Object.values(VectorType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <p className="text-xs text-[#141414]/60">
                    Auto-categorizado por IA. Puedes cambiarlo si la estructura es diferente.
                  </p>
                </div>

                <button 
                  onClick={runAnalysis}
                  disabled={state.progress.analysis === 'loading'}
                  className="bg-[#141414] text-[#E4E3E0] py-4 px-8 font-mono text-sm tracking-widest uppercase hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {state.progress.analysis === 'loading' ? 'Analizando...' : 'Iniciar Análisis Estructural'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ANALYSIS */}
          {state.step === 3 && state.analysis && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 border border-[#141414] bg-white/50 space-y-4">
                  <div className="flex items-center gap-2 opacity-30">
                    <Layout size={14} />
                    <span className="text-[10px] uppercase font-mono tracking-widest">Estructura</span>
                  </div>
                  <p className="font-serif italic text-lg leading-tight">{state.analysis.structure}</p>
                </div>
                <div className="p-6 border border-[#141414] bg-white/50 space-y-4">
                  <div className="flex items-center gap-2 opacity-30">
                    <Activity size={14} />
                    <span className="text-[10px] uppercase font-mono tracking-widest">Geometría</span>
                  </div>
                  <p className="font-serif italic text-lg leading-tight">{state.analysis.baseShapes}</p>
                </div>
                <div className="p-6 border border-[#141414] bg-white/50 space-y-4">
                  <div className="flex items-center gap-2 opacity-30">
                    <Palette size={14} />
                    <span className="text-[10px] uppercase font-mono tracking-widest">Colores</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.analysis.colors.map(c => (
                      <div key={c} className="w-8 h-8 border border-[#141414]" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 pt-12 border-t border-[#141414]/10">
                <div className="flex-1 space-y-6">
                  <h3 className="text-[10px] uppercase font-mono tracking-widest opacity-50 flex items-center gap-2">
                    <Settings2 size={12} /> Configuración de Salida
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="space-y-1">
                      <span className="text-[10px] uppercase font-mono block opacity-50">Fidelidad</span>
                      <select 
                        className="w-full bg-transparent border-b border-[#141414] py-1 font-serif italic"
                        value={state.settings.fidelity}
                        onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, fidelity: e.target.value as Fidelity } }))}
                      >
                        {Object.values(Fidelity).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pt-4">
                      <input 
                        type="checkbox" 
                        checked={state.settings.precisionMode} 
                        onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, precisionMode: e.target.checked } }))}
                        className="w-4 h-4 border-[#141414]"
                      />
                      <span className="text-[10px] uppercase font-mono opacity-50">Modo Súper Precisión</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={runGeneration}
                    className="bg-[#141414] text-[#E4E3E0] py-4 px-12 font-mono text-sm tracking-widest uppercase hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    Generar Vectorial <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: PROGRESS */}
          {state.step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto py-20 space-y-12"
            >
              <div className="space-y-8">
                {[
                  { key: 'analysis', label: 'Análisis Estructural', status: state.progress.analysis },
                  { key: 'structure', label: 'Sistema Geométrico', status: state.progress.structure },
                  { key: 'svgBase', label: 'Construcción SVG Base', status: state.progress.svgBase },
                  { key: 'color', label: 'Aplicación de Color & Gradientes', status: state.progress.color },
                ].map((phase, i) => (
                  <div key={phase.key} className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center ${phase.status === 'done' ? 'bg-[#141414] text-[#E4E3E0]' : ''}`}>
                        {phase.status === 'done' ? <CheckCircle2 size={16} /> : phase.status === 'loading' ? <RefreshCw size={16} className="animate-spin" /> : <Circle size={16} />}
                      </div>
                      {i < 3 && <div className="w-px h-12 bg-[#141414]/20 my-1" />}
                    </div>
                    <div className={phase.status === 'idle' ? 'opacity-30' : ''}>
                      <span className="text-[10px] uppercase font-mono tracking-widest block opacity-50">Fase 0{i + 1}</span>
                      <h3 className="text-xl font-serif italic">{phase.label}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 6: RESULT */}
          {state.step === 6 && state.svgFinal && state.image && (
            <motion.div 
              key="step6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-12">
                  <CompareSlider original={state.image} svg={state.svgFinal} />
                </div>
              </div>

              <div className="bg-white border border-[#141414] p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <h3 className="text-2xl font-serif italic">Vectorización Completa</h3>
                  <p className="text-xs font-mono opacity-50 uppercase tracking-widest">SVG optimizado para web y editores profesionales</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={runRefinement}
                    disabled={state.progress.refinement === 'loading'}
                    className="flex items-center gap-2 px-6 py-3 border border-dashed border-[#141414] font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                  >
                    {state.progress.refinement === 'loading' ? <RefreshCw size={14} className="animate-spin" /> : <Eye size={14} />} 
                    Refinar con IA
                  </button>
                  <button onClick={copyToClipboard} className="flex items-center gap-2 px-6 py-3 border border-[#141414] font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
                    <Copy size={14} /> Copiar Código
                  </button>
                  <button onClick={downloadSVG} className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-opacity-80 transition-all">
                    <Download size={14} /> Descargar SVG
                  </button>
                  <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 border border-[#141414] font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
                    <ExternalLink size={14} /> Canva
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 border-t border-[#141414]/10 mt-auto text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-30">Powered by Gemini AI Studio & Multimodal Vector Engine</p>
      </footer>
    </div>
  );
}
