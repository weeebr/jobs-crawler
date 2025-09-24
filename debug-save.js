const testRecord = {
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
    isNewThisRun: true
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
};

console.log("Test record:", JSON.stringify(testRecord, null, 2));
console.log("Title:", testRecord.job.title);
console.log("Title length:", testRecord.job.title.length);
console.log("Title trim:", testRecord.job.title.trim());
console.log("Title is empty after trim:", testRecord.job.title.trim() === '');
