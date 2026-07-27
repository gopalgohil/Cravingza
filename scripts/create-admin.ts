import { spawn } from "child_process";
import path from "path";

const args = process.argv.slice(2);
const backendDir = path.resolve(__dirname, "../backend");

// Spawn the working backend script with correct working directory to resolve all packages correctly
const child = spawn("npx", ["tsx", "scripts/create-admin.ts", ...args], {
  cwd: backendDir,
  stdio: "inherit",
  shell: true, // Crucial for cross-platform and executing npx correctly
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
