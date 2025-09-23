interface CompanyDisplayProps {
  company: string;
  companyUrl?: string | null;
}

export function CompanyDisplay({ company, companyUrl }: CompanyDisplayProps) {
  if (company.toLowerCase() === 'jobs') {
    // Don't display company name if it's "jobs" unless we have a URL
    return companyUrl ? (
      <a 
        href={companyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
        title="Visit company website"
      >
        ↗
      </a>
    ) : null;
  }
  
  // Normal company display logic
  return companyUrl ? (
    <a 
      href={companyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-lg font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
      title="Visit company website"
    >
      {company}
    </a>
  ) : (
    <p className="text-lg font-medium text-gray-700">{company}</p>
  );
}
