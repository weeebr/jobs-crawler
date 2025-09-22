#!/usr/bin/env node

/**
 * Verification script to test LLM match scoring
 * Run with: node verify-llm.js
 */

const { rankMatchScore } = require('./lib/rankMatch.ts');

const testJob = {
  title: "Senior React Developer",
  company: "TechCorp",
  stack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
  qualifications: ["5+ years React experience", "Strong TypeScript skills"],
  roles: ["Build user interfaces", "Lead technical decisions"],
  benefits: ["Health insurance", "Remote work"],
};

const testCv = {
  roles: [
    {
      title: "Frontend Developer",
      stack: ["React", "JavaScript", "TypeScript"],
      years: 4,
    },
    {
      title: "Full Stack Developer", 
      stack: ["Node.js", "PostgreSQL", "React"],
      years: 2,
    }
  ],
  skills: ["React", "TypeScript", "JavaScript", "Node.js"],
  projects: [
    {
      name: "E-commerce Platform",
      stack: ["React", "Node.js", "PostgreSQL"],
      impact: "Increased conversion by 25%"
    }
  ],
  education: [
    {
      degree: "Computer Science",
      institution: "University of Tech"
    }
  ],
  keywords: ["frontend", "react", "full-stack", "javascript"]
};

const testHeuristics = {
  matchScore: 85,
  gaps: []
};

async function verifyLLM() {
  console.log('🔍 Testing LLM Match Scoring...\n');
  
  console.log('Job:', testJob.title, 'at', testJob.company);
  console.log('Stack:', testJob.stack.join(', '));
  console.log('CV Experience:', testCv.roles.length, 'roles');
  console.log('CV Skills:', testCv.skills.join(', '));
  console.log('');
  
  try {
    const result = await rankMatchScore({
      job: testJob,
      cv: testCv,
      heuristics: testHeuristics
    });
    
    console.log('✅ Match Score:', result.matchScore);
    console.log('📊 Source:', result.source);
    console.log('💭 Reasoning:', result.reasoning);
    
    if (result.source === 'llm') {
      console.log('\n🎉 LLM integration is working!');
    } else {
      console.log('\n⚠️  Using heuristic fallback (check OPENAI_API_KEY)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyLLM();
