interface LetterModalHeaderProps {
  onClose: () => void;
}

export function LetterModalHeader({ onClose }: LetterModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Motivation Letter Generator</h2>
        <p className="text-gray-600">
          Generate a truthful draft that mirrors the job requirements
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close modal"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
