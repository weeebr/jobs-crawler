// Test the clientRecordToDbRecord function directly
const testRecord = {
  id: 12345,
  job: {
    title: "Test Job",
    company: "Test Company",
    stack: ["React"],
    sourceUrl: "https://example.com",
    description: "Test description",
    qualifications: ["5+ years experience"],
    roles: ["Developer"],
    benefits: ["Health insurance"]
  },
  cv: {
    roles: [{ title: "Developer", stack: ["React"] }],
    skills: ["React"],
    projects: [],
    education: [],
    keywords: []
  },
  llmAnalysis: {
    matchScore: 85,
    reasoning: ["Good match"],
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: "1.0"
  },
  userInteractions: {
    interactionCount: 0,
    isNewThisRun: true,
    status: undefined
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// Simulate the clientRecordToDbRecord logic
function createDescriptionFromJobData(job) {
  const sections = [
    ...(job.qualifications ?? []),
    ...(job.roles ?? []),
    ...(job.benefits ?? []),
  ];

  if (sections.length === 0) {
    return null;
  }

  return sections.join('\n\n');
}

function clientRecordToDbRecord(record) {
  console.log("Converting client record to DB record");
  console.log("Client record job.title:", record.job.title);
  console.log("Client record job:", JSON.stringify(record.job, null, 2));

  const result = {
    title: record.job.title,
    company: record.job.company,
    description: createDescriptionFromJobData(record.job),
    publishedAt: record.job.publishedAt || null,
    location: record.job.location || null,
    workload: record.job.workload || null,
    duration: record.job.duration || null,
    size: record.job.size || null,
    companySize: record.job.companySize || null,
    stack: record.job.stack,
    qualifications: record.job.qualifications || [],
    roles: record.job.roles || [],
    benefits: record.job.benefits || [],
    matchScore: record.llmAnalysis.matchScore,
    reasoning: JSON.stringify(record.llmAnalysis.reasoning),
    status: record.userInteractions.status || null,
    isNewThisRun: record.userInteractions.isNewThisRun || false,
    sourceUrl: record.job.sourceUrl || null,
    sourceType: null,
  };

  console.log("DB record:", JSON.stringify(result, null, 2));
  return result;
}

try {
  const dbRecord = clientRecordToDbRecord(testRecord);
  console.log("Conversion successful");
} catch (error) {
  console.error("Conversion failed:", error);
}
