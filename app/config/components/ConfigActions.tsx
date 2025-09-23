"use client";

interface ConfigActionsProps {
  isLoading: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function ConfigActions({ isLoading, onSave, onReset }: ConfigActionsProps) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        onClick={onReset}
        className="btn-secondary"
        disabled={isLoading}
      >
        Reset to Defaults
      </button>
      
      <div className="flex items-center space-x-3">
        <a
          href="/"
          className="btn-secondary"
        >
          Back to Home
        </a>
        <button
          onClick={onSave}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
