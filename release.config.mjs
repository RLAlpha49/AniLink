/**
 * semantic-release configuration for AniLink.
 *
 * This project ships as a standard npm package, so the release flow is
 * focused on conventional commits, changelog generation, npm publishing,
 * and GitHub Releases.
 */

/** @type {import('semantic-release').GlobalConfig} */
export default {
  branches: ["master"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "security", release: "patch" },
          { type: "build", scope: "deps", release: "patch" },
          { type: "docs", release: "patch" },
          { type: "refactor", release: "patch" },
          { type: "style", release: "patch" },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "✨ Features" },
            { type: "fix", section: "🐛 Bug Fixes" },
            { type: "perf", section: "⚡ Performance" },
            { type: "refactor", section: "♻️ Refactoring" },
            { type: "docs", section: "📚 Documentation" },
            { type: "style", section: "💎 Style" },
            { type: "build", section: "📦 Build" },
            { type: "ci", section: "🔧 CI/CD" },
            { type: "test", section: "🧪 Tests" },
            { type: "chore", section: "🧹 Chores", hidden: true },
          ],
        },
      },
    ],
    ["@semantic-release/npm", { npmPublish: true }],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
        changelogTitle: "# Changelog",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    [
      "@semantic-release/github",
      {
        successComment: false,
        failComment: false,
      },
    ],
  ],
};
