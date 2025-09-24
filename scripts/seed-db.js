#!/usr/bin/env node

/**
 * Database seeding script for development
 * This script populates the database with sample data for testing
 */

import { db } from '../lib/db/index.js';
import { users, analysisRecords, cvProfiles } from '../lib/db/schema.js';
import { hashApiKey } from '../lib/db/users.js';

const SAMPLE_API_KEY = 'sk-test12345678901234567890123456789012345678901234567890';

console.log('🌱 Seeding database with sample data...');

async function seedDatabase() {
  try {
    // Create a sample user
    const apiKeyHash = hashApiKey(SAMPLE_API_KEY);
    const user = await db.insert(users).values({
      apiKeyHash,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      totalAnalyses: 0,
      preferredModel: 'gpt-4o-mini',
    }).returning();

    const userId = user[0].id;
    console.log(`✅ Created user with ID: ${userId}`);

    // Create a sample CV profile
    const cvProfile = await db.insert(cvProfiles).values({
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'John Doe',
      email: 'john.doe@example.com',
      roles: JSON.stringify([
        {
          title: 'Senior Full Stack Developer',
          stack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          years: 5,
        },
        {
          title: 'Frontend Developer',
          stack: ['React', 'JavaScript', 'CSS', 'HTML'],
          years: 3,
        },
      ]),
      skills: JSON.stringify([
        'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB',
        'GraphQL', 'REST APIs', 'Docker', 'AWS', 'Git'
      ]),
      projects: JSON.stringify([
        {
          name: 'E-commerce Platform',
          impact: 'Increased conversion rate by 40%',
          stack: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
        },
        {
          name: 'Real-time Chat Application',
          impact: 'Handled 10k+ concurrent users',
          stack: ['React', 'Socket.io', 'MongoDB', 'AWS'],
        },
      ]),
      education: JSON.stringify([
        {
          degree: 'Bachelor of Computer Science',
          institution: 'University of Technology',
        },
      ]),
      keywords: JSON.stringify([
        'fullstack', 'react', 'nodejs', 'typescript', 'postgresql',
        'mongodb', 'graphql', 'docker', 'aws', 'microservices'
      ]),
      isActive: true,
    }).returning();

    console.log(`✅ Created CV profile with ID: ${cvProfile[0].id}`);

    // Create sample analysis records
    const sampleJobs = [
      {
        title: 'Senior React Developer',
        company: 'TechCorp Inc.',
        description: 'We are looking for a senior React developer to join our team...',
        stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        matchScore: 85.5,
        reasoning: 'Strong match with React and TypeScript experience. Good fit for senior level position.',
        status: 'interested',
      },
      {
        title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        description: 'Join our fast-growing startup as a full stack engineer...',
        stack: ['React', 'Node.js', 'MongoDB', 'AWS'],
        matchScore: 92.3,
        reasoning: 'Excellent match across all required technologies. Experience with both frontend and backend.',
        status: 'applied',
      },
      {
        title: 'Frontend Developer',
        company: 'DesignAgency',
        description: 'Looking for a creative frontend developer...',
        stack: ['React', 'CSS', 'JavaScript', 'Figma'],
        matchScore: 78.1,
        reasoning: 'Good frontend skills but missing some design tool experience.',
        status: null,
      },
    ];

    for (const job of sampleJobs) {
      const analysis = await db.insert(analysisRecords).values({
        userId,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        updatedAt: new Date(),
        ...job,
        isNewThisRun: Math.random() > 0.7, // 30% chance of being "new this run"
      }).returning();

      console.log(`✅ Created analysis record: ${job.title} at ${job.company} (Score: ${job.matchScore})`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • User: ${userId}`);
    console.log(`   • CV Profile: ${cvProfile[0].id}`);
    console.log(`   • Job Analyses: ${sampleJobs.length}`);
    console.log('\n🔑 Sample API Key for testing:');
    console.log(`   ${SAMPLE_API_KEY}`);

  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase().then(() => {
  console.log('\n✨ Seeding complete! You can now test the application.');
  process.exit(0);
});
