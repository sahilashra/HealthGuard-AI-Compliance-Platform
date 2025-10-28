import React from 'react';
import { ExportButtonProps } from '@/types/healthguard';
import { Download, Loader2, CheckCircle } from 'lucide-react';

export const ExportButton: React.FC<ExportButtonProps> = ({
  selectedCount = 0,
  onExport,
  loading = false,
  disabled = false
}) => {
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleClick = () => {
    if (onExport) {
      onExport();
      // Don't show success here - let the parent component handle it through the loading prop
    }
  };

  // Show success briefly when loading changes from true to false
  React.useEffect(() => {
    if (!loading && showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, showSuccess]);

  const isDisabled = disabled || loading || selectedCount === 0;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        relative inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium
        transition-all duration-200 group
        ${
          disabled || selectedCount === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : loading
            ? 'bg-blue-500 text-white cursor-wait'
            : showSuccess
            ? 'bg-green-500 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-95'
        }
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : showSuccess ? (
        <>
          <CheckCircle className="w-5 h-5" />
          <span>Exported!</span>
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          <span>
            Export {selectedCount > 0 ? `(${selectedCount})` : 'Test Cases'}
          </span>
        </>
      )}

      {/* Tooltip */}
      {selectedCount === 0 && !disabled && !loading && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Select test cases to export
        </div>
      )}
    </button>
  );
};
