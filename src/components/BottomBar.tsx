import React, { useEffect, useState } from 'react';

interface BottomBarProps {
  buttonText: string;
  onClick: () => void;
  disabled?: boolean;
  summaryText?: string;
  errorText?: string;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  buttonText,
  onClick,
  disabled = false,
  summaryText,
  errorText,
  secondaryButtonText,
  onSecondaryClick,
}) => {
  const [viewportBottom, setViewportBottom] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const offset = window.innerHeight - window.visualViewport.height;
        setViewportBottom(Math.max(0, offset));
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  return (
    <div
      className="fixed left-0 right-0 z-30 bg-surface border-t border-line shadow-[0_-4px_12px_rgba(51,37,27,0.06)]"
      style={{ bottom: `${viewportBottom}px` }}
    >
      <div className="max-w-[480px] mx-auto px-4 py-3 flex flex-col gap-2">
        {errorText && (
          <div className="text-sm text-danger font-medium text-center">
            {errorText}
          </div>
        )}
        {summaryText && (
          <div className="text-sm font-semibold text-ink text-center tabular-nums">
            {summaryText}
          </div>
        )}
        <div className="flex gap-2">
          {secondaryButtonText && onSecondaryClick && (
            <button
              type="button"
              onClick={onSecondaryClick}
              className="h-12 px-4 rounded-lg border border-edge text-ink font-semibold text-sm hover:bg-cream transition-colors"
            >
              {secondaryButtonText}
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`w-full h-12 rounded-lg font-semibold text-base transition-colors flex items-center justify-center ${
              disabled
                ? 'bg-gray text-muted cursor-not-allowed'
                : 'bg-brand hover:bg-brand-hover text-white active:bg-brand-hover'
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
