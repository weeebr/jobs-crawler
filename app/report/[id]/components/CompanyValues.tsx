interface CompanyValuesProps {
  motto: string;
  mottoOrigin?: any;
}

export function CompanyValues({ motto, mottoOrigin }: CompanyValuesProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4 shadow-sm">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Company Values</h3>
          <blockquote className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-blue-300 pl-2 line-clamp-3">
            "{motto}"
          </blockquote>
          {mottoOrigin && (
            <div className="text-xs text-gray-500 flex items-start gap-1 mt-2">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs leading-relaxed">
                Source: {mottoOrigin.source.replace('_', ' ')} 
                {mottoOrigin.confidence && ` (${mottoOrigin.confidence} confidence)`}
                {mottoOrigin.extractedFrom && ` • ${mottoOrigin.extractedFrom}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
