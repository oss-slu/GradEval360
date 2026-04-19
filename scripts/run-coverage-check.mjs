import { spawn } from "node:child_process";

function getRequiredValue(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    throw new Error(`Missing required flag: ${flag}`);
  }

  return args[index + 1];
}

function getTrailingArgs(args, knownFlags) {
  const trailing = [];

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (knownFlags.has(current)) {
      index += 1;
      continue;
    }
    trailing.push(current);
  }

  return trailing;
}

const cliArgs = process.argv.slice(2);
const knownFlags = new Set(["--loader", "--lines", "--branches", "--functions"]);

const loader = getRequiredValue(cliArgs, "--loader");
const lineThreshold = Number(getRequiredValue(cliArgs, "--lines"));
const branchThreshold = Number(getRequiredValue(cliArgs, "--branches"));
const functionThreshold = Number(getRequiredValue(cliArgs, "--functions"));
const testPatterns = getTrailingArgs(cliArgs, knownFlags);

if (testPatterns.length === 0) {
  throw new Error("At least one test pattern is required.");
}

const nodeArgs = [
  "--import",
  loader,
  "--test",
  "--experimental-test-coverage",
  ...testPatterns,
];

const child = spawn(process.execPath, nodeArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

let combinedOutput = "";

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  combinedOutput += text;
  process.stdout.write(text);
});

child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  combinedOutput += text;
  process.stderr.write(text);
});

child.on("close", (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  const totals = combinedOutput.match(
    /all files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/,
  );

  if (!totals) {
    console.error("Coverage summary not found in test output.");
    process.exit(1);
  }

  const [, linesRaw, branchesRaw, functionsRaw] = totals;
  const lines = Number(linesRaw);
  const branches = Number(branchesRaw);
  const functions = Number(functionsRaw);
  const failures = [];

  if (lines < lineThreshold) {
    failures.push(`Line coverage ${lines.toFixed(2)}% is below ${lineThreshold}%`);
  }

  if (branches < branchThreshold) {
    failures.push(`Branch coverage ${branches.toFixed(2)}% is below ${branchThreshold}%`);
  }

  if (functions < functionThreshold) {
    failures.push(`Function coverage ${functions.toFixed(2)}% is below ${functionThreshold}%`);
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure);
    }
    process.exit(1);
  }
});
