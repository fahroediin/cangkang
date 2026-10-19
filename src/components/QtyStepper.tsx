import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QtyStepperProps {
  value: string | number;
  onChange: (val: string) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const QtyStepper: React.FC<QtyStepperProps> = ({
  value,
  onChange,
  onIncrement,
  onDecrement,
  disabled = false,
}) => {
  const handleDecrement = () => {
    if (disabled) return;
    if (onDecrement) {
      onDecrement();
    } else {
      const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) || 0 : value;
      const next = Math.max(0, num - 0.5);
      onChange(next.toString().replace('.', ','));
    }
  };

  const handleIncrement = () => {
    if (disabled) return;
    if (onIncrement) {
      onIncrement();
    } else {
      const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) || 0 : value;
      const next = num + 0.5;
      onChange(next.toString().replace('.', ','));
    }
  };

  return (
    <div className="flex items-center border border-edge rounded-lg bg-surface overflow-hidden">
      <button
        type="button"
        aria-label="Kurangi 0,5 kg"
        onClick={handleDecrement}
        disabled={disabled}
        className="w-11 h-11 flex items-center justify-center text-ink hover:bg-cream active:bg-soft disabled:opacity-40 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="flex items-center px-2">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-14 text-center font-semibold text-base text-ink tabular-nums bg-transparent focus:outline-none"
        />
        <span className="text-sm font-normal text-muted">kg</span>
      </div>

      <button
        type="button"
        aria-label="Tambah 0,5 kg"
        onClick={handleIncrement}
        disabled={disabled}
        className="w-11 h-11 flex items-center justify-center text-ink hover:bg-cream active:bg-soft disabled:opacity-40 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
