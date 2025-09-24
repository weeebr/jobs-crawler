#!/usr/bin/env node

/**
 * Fly.io Setup Script for Jobs Crawler
 *
 * This script automates the complete setup process for deploying to Fly.io:
 * 1. Verifies local code quality
 * 2. Builds the application
 * 3. Sets up Fly.io application
 * 4. Configures PostgreSQL database
 * 5. Prepares deployment
 *
 * Usage: node scripts/setup-fly.js [--deploy]
 */

import { spawn, execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..", "..");
const projectRoot = __dirname;

const argv = new Set(process.argv.slice(2));
const SHOULD_DEPLOY = argv.has("--deploy");

console.log("🚀 Fly.io Setup for Jobs Crawler");
console.log("===================================");

async function runStep(step, command, description) {
  console.log(`\n📋 ${step}: ${description}`);

  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(" ");
    const process = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      console.log(`  ${text.trim()}`);
    });

    process.stderr.on("data", (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(`  ❌ ${text.trim()}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log(`  ✅ ${step} completed successfully`);
        resolve({ code, output, errorOutput });
      } else {
        console.error(`  ❌ ${step} failed with code ${code}`);
        console.error(`  Error: ${errorOutput}`);
        reject(new Error(`${step} failed: ${errorOutput}`));
      }
    });
  });
}

async function main() {
  try {
    console.log("\n🔍 Step 1/5: Verifying local code quality");
    await runStep("1", "npm run verify:fast", "Running linting, tests, and build verification");

    console.log("\n🔨 Step 2/5: Building application");
    await runStep("2", "npm run build", "Building optimized production version");

    console.log("\n🚁 Step 3/5: Checking Fly.io status");
    try {
      await runStep("3", "fly status", "Checking if Fly.io app exists");
    } catch (error) {
      console.log("  📝 Fly.io app doesn't exist, creating new app...");
      await runStep("3", "fly launch --no-deploy", "Creating new Fly.io application");
    }

    console.log("\n🗄️ Step 4/5: Setting up database");
    try {
      await runStep("4", "fly postgres list", "Checking existing databases");
    } catch (error) {
      console.log("  📝 No databases found, creating PostgreSQL database...");
      await runStep("4", "fly postgres create --name jobs-crawler-db --vm-size shared-cpu-1x --initial-cluster-size 1", "Creating PostgreSQL database");
    }

    console.log("\n📦 Step 5/5: Preparing deployment");
    await runStep("5", "fly deploy --no-deploy", "Preparing deployment configuration");

    console.log("\n🎉 Setup Complete!");
    console.log("==================");

    if (SHOULD_DEPLOY) {
      console.log("🚀 Deploying to Fly.io...");
      await runStep("Deploy", "fly deploy", "Deploying to production");
      console.log("\n🎊 Deployment successful!");
    } else {
      console.log("📝 To deploy, run: npm run deploy:fly");
      console.log("🔗 Or use: fly deploy");
    }

    console.log("\n📋 Available commands:");
    console.log("  • npm run db:connect    - Connect to database");
    console.log("  • npm run deploy:fly    - Deploy to Fly.io");
    console.log("  • fly logs              - View application logs");
    console.log("  • fly status            - Check app status");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("  • Make sure Fly.io CLI is installed: fly --version");
    console.log("  • Authenticate: fly auth login");
    console.log("  • Check logs: fly logs");
    process.exit(1);
  }
}

main().catch(console.error);
