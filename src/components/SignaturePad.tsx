import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    onClear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const dataUrl = sigCanvas.current?.getCanvas().toDataURL('image/png');
    if (dataUrl) onSave(dataUrl);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">Assinatura Digital</label>
      <div className="border-2 border-dashed border-zinc-300 rounded-lg bg-white overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: "w-full h-40 cursor-crosshair",
          }}
          onEnd={save}
        />
      </div>
      <button
        type="button"
        onClick={clear}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <RotateCcw size={14} />
        Limpar Assinatura
      </button>
    </div>
  );
};
