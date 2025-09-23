import type { AnalysisRecord } from "@/lib/types";

interface JobContentProps {
  record: AnalysisRecord;
}

export function JobContent({ record }: JobContentProps) {
  const sections = [
    {
      title: "Requirements",
      items: record.job.qualifications,
      icon: "📋",
    },
    {
      title: "Responsibilities",
      items: record.job.roles,
      icon: "🎯",
    },
    {
      title: "Benefits",
      items: record.job.benefits,
      icon: "✨",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {sections.map((section) => (
        <div key={section.title} className="card p-3">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <span>{section.icon}</span>
            {section.title}
          </h3>
          {section.items.length > 0 ? (
            <ul className="space-y-1.5">
              {section.items.map((item: string, index: number) => (
                <li
                  key={index}
                  className="text-xs text-gray-700 leading-relaxed flex items-start gap-1.5"
                >
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">
              No {section.title.toLowerCase()} found
            </p>
          )}
        </div>
      ))}
    </div>
  );
}


