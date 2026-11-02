// RN 0.83's Foojay 0.5.0 references IBM_SEMERU removed by Gradle 9.
// Narrow, idempotent patch; keep Gradle 9 and JDK 17.
// Upstream: https://github.com/gradle/foojay-toolchains/blob/main/CHANGELOG.md
// Tracking: https://github.com/reactwg/react-native-releases/issues/1349
const fs = require("node:fs");
const path = require("node:path");
const packagePath = require.resolve("@react-native/gradle-plugin/package.json");
const settings = path.join(path.dirname(packagePath), "settings.gradle.kts");
const original = fs.readFileSync(settings, "utf8");
const old =
  'id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")';
const fixed =
  'id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")';
if (original.includes(old)) {
  fs.writeFileSync(settings, original.replace(old, fixed));
  console.log("Android toolchain: Foojay 0.5.0 → 1.0.0 for Gradle 9.");
} else if (original.includes(fixed)) {
  console.log("Android toolchain patch already applied.");
} else {
  console.log(
    "Android toolchain: upstream settings changed; no patch applied. Review compatibility before upgrading.",
  );
}
