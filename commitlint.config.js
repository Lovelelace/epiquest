export default {
  extends: ["@commitlint/config-conventional"],
  // Les messages générés par Dependabot (« Bump x from 1 to 2 ») ne suivent pas
  // la casse attendue ; ils sont vérifiés par Dependabot lui-même.
  ignores: [(message) => message.includes("Signed-off-by: dependabot[bot]")],
};
