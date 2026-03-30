const path = require("path");

const mobileRoot = path.join(__dirname, "apps", "mobile");
// eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-require-imports
const { expo } = require(path.join(mobileRoot, "app.json"));

/** Paths in apps/mobile/app.json are relative to apps/mobile; from monorepo root they must be prefixed. */
function fromMobile(rel) {
  if (typeof rel !== "string" || !rel.startsWith("./")) {
    return rel;
  }
  const tail = rel.slice(2).split(path.sep).join("/");
  return `./apps/mobile/${tail}`;
}

module.exports = {
  expo: {
    ...expo,
    // Root package.json is Vite (`main: index.js`); EAS/Metro must use the Expo app entry.
    main: "expo-router/entry",
    icon: fromMobile(expo.icon),
    splash: expo.splash
      ? {
          ...expo.splash,
          image: fromMobile(expo.splash.image),
        }
      : expo.splash,
    web: expo.web
      ? {
          ...expo.web,
          favicon: fromMobile(expo.web.favicon),
        }
      : expo.web,
  },
};
