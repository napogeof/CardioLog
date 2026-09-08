import { X, HelpCircle, CheckCircle, Coffee, Armchair, Ban, HeartHandshake } from 'lucide-react';

interface QuickTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickTipsModal({ isOpen, onClose }: QuickTipsModalProps) {
  if (!isOpen) return null;

  const tips = [
    {
      icon: <Armchair className="w-5 h-5 text-sky-400" />,
      title: 'Reposo previo de 5 minutos',
      desc: 'Siéntate en silencio y con la espalda apoyada durante 5 minutos antes de iniciar la medición.'
    },
    {
      icon: <Coffee className="w-5 h-5 text-amber-400" />,
      title: 'Evita estímulos 30 minutos antes',
      desc: 'No tomes café, mate, bebidas energéticas, no fumes ni hagas ejercicio intenso en la media hora previa.'
    },
    {
      icon: <HeartHandshake className="w-5 h-5 text-rose-400" />,
      title: 'Brazo a la altura del corazón',
      desc: 'Apoya el brazo en una mesa para que el tensiómetro quede a nivel del pecho, con la palma hacia arriba.'
    },
    {
      icon: <Ban className="w-5 h-5 text-purple-400" />,
      title: 'No hablar ni cruzar las piernas',
      desc: 'Mantén los pies apoyados en el suelo. Hablar o cruzar las piernas puede elevar falsamente la sistólica hasta 10 mmHg.'
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      title: 'Toma doble con 1-2 minutos de intervalo',
      desc: 'Si los valores son inusuales, espera un par de minutos y repite la toma para registrar el valor más estable.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Guía de Toma Correcta</h2>
              <p className="text-[11px] text-slate-400">Recomendaciones clínicas para una medición fiable</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0">
                {tip.icon}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white mb-0.5">{tip.title}</h3>
                <p className="text-[11.5px] text-slate-400 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
