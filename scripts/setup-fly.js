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
    console.log("\n🔍 Step 1/4: Verifying local code quality");
    await runStep("1", "POST_VERIFY_DEPLOY=1 npm run verify:fast", "Running linting, tests, and build verification for deployment");

    console.log("\n🚁 Step 2/4: Checking Fly.io status");
    try {
      await runStep("2", "fly status", "Checking if Fly.io app exists");
    } catch (error) {
      console.log("  📝 Fly.io app doesn't exist, creating new app...");
      await runStep("2", "fly launch --no-deploy --name jobs-crawler", "Creating new Fly.io application");
    }

    console.log("\n🔧 Step 3/4: Configuring environment");
    console.log("  📝 Using SQLite database with native Node.js deployment");
    console.log("  📝 Database will be stored in persistent Fly.io volume");

    console.log("\n📦 Step 4/4: Deploying to Fly.io");
    console.log("  📝 Fly.io will handle the build process automatically");
    await runStep("4", "fly deploy", "Deploying to Fly.io with native Node.js support");

    console.log("\n🎉 Setup Complete!");
    console.log("==================");

    if (SHOULD_DEPLOY) {
      console.log("🚀 Deploying to Fly.io with native Node.js support...");
      await runStep("Deploy", "fly deploy", "Deploying to production");
      console.log("\n🎊 Deployment successful!");
    } else {
      console.log("📝 To deploy, run: fly deploy");
      console.log("🔗 Or use: npm run deploy:fly");
    }

    console.log("\n📋 Available commands:");
    console.log("  • fly logs              - View application logs");
    console.log("  • fly status            - Check app status");
    console.log("  • fly ssh console       - Open SSH console to app");
    console.log("  • fly scale show        - Check app scaling");

  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("  • Make sure Fly.io CLI is installed: fly version");
    console.log("  • Authenticate: fly auth login");
    console.log("  • Check app status: fly status");
    console.log("  • View logs: fly logs");
    console.log("  • Check build logs: fly logs --app jobs-crawler");
    process.exit(1);
  }
}

main().catch(console.error);
