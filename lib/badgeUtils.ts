// Centralized badge color logic for consistent styling across all components

export function getTechCategory(tech: string): string {
  const lowerTech = tech.toLowerCase();
  
  // Frontend technologies
  if (['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'gatsby', 'html', 'css', 'javascript', 'typescript', 'jsx', 'tsx', 'tailwind', 'bootstrap', 'sass', 'scss', 'less', 'webpack', 'vite', 'parcel'].includes(lowerTech)) {
    return 'frontend';
  }
  
  // Backend technologies
  if (['node.js', 'nodejs', 'express', 'fastify', 'koa', 'django', 'flask', 'spring', 'laravel', 'symfony', 'rails', 'sinatra', 'gin', 'echo', 'fiber', 'asp.net', 'dotnet', '.net', 'php', 'python', 'ruby', 'go', 'golang', 'rust', 'java', 'c#', 'csharp'].includes(lowerTech)) {
    return 'backend';
  }
  
  // Database technologies
  if (['mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'sqlite', 'mariadb', 'oracle', 'sql server', 'cassandra', 'elasticsearch', 'neo4j', 'dynamodb', 'firebase', 'supabase'].includes(lowerTech)) {
    return 'database';
  }
  
  // DevOps/Infrastructure
  if (['docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible', 'vagrant', 'nginx', 'apache', 'traefik', 'istio', 'helm', 'prometheus', 'grafana', 'elk', 'splunk'].includes(lowerTech)) {
    return 'devops';
  }
  
  // Mobile technologies
  if (['react native', 'flutter', 'swift', 'kotlin', 'android', 'ios', 'xamarin', 'cordova', 'ionic', 'expo'].includes(lowerTech)) {
    return 'mobile';
  }
  
  // Cloud technologies
  if (['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify', 'digital ocean', 'linode', 'cloudflare', 's3', 'lambda', 'ec2', 'rds', 'sns', 'sqs'].includes(lowerTech)) {
    return 'cloud';
  }
  
  // Development tools
  if (['git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'discord', 'figma', 'sketch', 'adobe', 'vscode', 'vim', 'emacs', 'intellij', 'webstorm', 'postman', 'insomnia'].includes(lowerTech)) {
    return 'tools';
  }
  
  // Testing frameworks
  if (['jest', 'mocha', 'chai', 'cypress', 'playwright', 'selenium', 'puppeteer', 'vitest', 'testing library', 'enzyme', 'karma', 'jasmine', 'ava', 'tape'].includes(lowerTech)) {
    return 'tools';
  }
  
  // CI/CD and DevOps tools
  if (['ci/cd', 'cicd', 'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis ci', 'azure devops', 'bamboo', 'teamcity', 'drone', 'concourse'].includes(lowerTech)) {
    return 'devops';
  }
  
  // Default to general tech
  return 'tech';
}

export function getTechBadgeStyle(tech: string): React.CSSProperties {
  const category = getTechCategory(tech);
  
  const styles = {
    frontend: { backgroundColor: 'transparent', color: '#1d4ed8', border: '1px solid #1d4ed8' },
    backend: { backgroundColor: 'transparent', color: '#15803d', border: '1px solid #15803d' },
    database: { backgroundColor: 'transparent', color: '#d97706', border: '1px solid #d97706' },
    devops: { backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #dc2626' },
    mobile: { backgroundColor: 'transparent', color: '#7c3aed', border: '1px solid #7c3aed' },
    cloud: { backgroundColor: 'transparent', color: '#0891b2', border: '1px solid #0891b2' },
    tools: { backgroundColor: 'transparent', color: '#374151', border: '1px solid #374151' },
    tech: { backgroundColor: 'transparent', color: '#1d4ed8', border: '1px solid #1d4ed8' }
  };
  
  return styles[category as keyof typeof styles] || styles.tech;
}

export function getTechBadgeClass(tech: string): string {
  const category = getTechCategory(tech);
  return `badge badge-tech-${category}`;
}

// Color-based ordering for tech stack pills
const COLOR_ORDER = {
  frontend: 1,    // Blue
  backend: 2,     // Green  
  database: 3,    // Orange
  devops: 4,      // Red
  mobile: 5,      // Purple
  cloud: 6,       // Cyan
  tools: 7,       // Gray
  tech: 8         // Default blue
};

export function sortTechStackByColor(techStack: string[]): string[] {
  return [...techStack].sort((a, b) => {
    const categoryA = getTechCategory(a);
    const categoryB = getTechCategory(b);
    
    const orderA = COLOR_ORDER[categoryA as keyof typeof COLOR_ORDER] || COLOR_ORDER.tech;
    const orderB = COLOR_ORDER[categoryB as keyof typeof COLOR_ORDER] || COLOR_ORDER.tech;
    
    // If same category, sort alphabetically
    if (orderA === orderB) {
      return a.localeCompare(b);
    }
    
    return orderA - orderB;
  });
}
