import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [, , clientPath, serverPath, sharedPath] = process.argv;

if (!clientPath || !serverPath || !sharedPath) {
  console.error("Usage: node scripts/update-readme-metrics.mjs <client> <server> <shared>");
  process.exit(1);
}

function parseCoverageReport(reportPath) {
  const content = readFileSync(reportPath, "utf8");
  const match = content.match(/all files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/);

  if (!match) {
    throw new Error(`Could not parse coverage totals from ${reportPath}`);
  }

  return {
    lines: Number(match[1]),
    branches: Number(match[2]),
    functions: Number(match[3]),
  };
}

function formatMetric(value) {
  return `${value.toFixed(2)}%`;
}

function getBadgeColor(lineCoverage) {
  if (lineCoverage >= 95) return "brightgreen";
  if (lineCoverage >= 90) return "green";
  if (lineCoverage >= 80) return "yellowgreen";
  if (lineCoverage >= 70) return "yellow";
  return "red";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const coverage = {
  client: parseCoverageReport(clientPath),
  server: parseCoverageReport(serverPath),
  shared: parseCoverageReport(sharedPath),
};

const averageLineCoverage =
  (coverage.client.lines + coverage.server.lines + coverage.shared.lines) / 3;
const generatedAt = new Date().toISOString().replace("T", " ").replace(".000Z", " UTC");

mkdirSync(".github/badges", { recursive: true });

writeFileSync(
  ".github/badges/coverage-summary.json",
  `${JSON.stringify(
    {
      schemaVersion: 1,
      label: "coverage",
      message: `${averageLineCoverage.toFixed(2)}% lines`,
      color: getBadgeColor(averageLineCoverage),
    },
    null,
    2,
  )}\n`,
);

const metricsSection = [
  "<!-- README_METRICS_START -->",
  "## Live Project Signals",
  "",
  "[![CI](https://github.com/oss-slu/GradEval360/actions/workflows/ci.yml/badge.svg)](https://github.com/oss-slu/GradEval360/actions/workflows/ci.yml) ![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/oss-slu/GradEval360/main/.github/badges/coverage-summary.json)",
  "",
  "This snapshot is auto-updated from GitHub Actions on pushes to `main`.",
  "",
  "| Workspace | Line Coverage | Branch Coverage | Function Coverage |",
  "| --- | ---: | ---: | ---: |",
  `| Client | ${formatMetric(coverage.client.lines)} | ${formatMetric(coverage.client.branches)} | ${formatMetric(coverage.client.functions)} |`,
  `| Server | ${formatMetric(coverage.server.lines)} | ${formatMetric(coverage.server.branches)} | ${formatMetric(coverage.server.functions)} |`,
  `| Shared | ${formatMetric(coverage.shared.lines)} | ${formatMetric(coverage.shared.branches)} | ${formatMetric(coverage.shared.functions)} |`,
  "",
  `Last metrics refresh: ${generatedAt}`,
  "<!-- README_METRICS_END -->",
].join("\n");

const readmePath = "README.md";
const readme = readFileSync(readmePath, "utf8");
const startMarker = "<!-- README_METRICS_START -->";
const endMarker = "<!-- README_METRICS_END -->";

const updatedReadme = readme.includes(startMarker) && readme.includes(endMarker)
  ? readme.replace(
      new RegExp(`${escapeRegex(startMarker)}[\\s\\S]*?${escapeRegex(endMarker)}`),
      metricsSection,
    )
  : readme.replace(
      "# GradEval360\n",
      `# GradEval360\n\n${metricsSection}\n\n`,
    );

writeFileSync(readmePath, updatedReadme);
