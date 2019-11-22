const {
  send,
  buffer
} = require("micro");
const axios = require("axios");
const fs = require("fs");
const {
  router,
  get
} = require("microrouter");
const semver = require('semver')

require("dotenv-safe").config();

const unknownImageUrl = `https://img.shields.io/badge/version-unknown-lightgrey.svg?style=flat-square`;
let unknownImage;

const cacheBadgeData = {}

const rootRoute = async (req, res) =>
  send(
    res,
    404,
    await Promise.resolve(
      "Please use this path format to get your badges: /@spscommerce/packagename"
    )
  );

const notFoundRoute = async (req, res) =>
  send(res, 404, await Promise.resolve("Not found route"));

const sendUnknown = async () => {
  if (!unknownImage)
    unknownImage = await axios.get(unknownImageUrl);
  send(res, 200, await Promise.resolve(unknownImage.data));
}

const badgeRoute = async (req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Pragma", "no-cache");

  const sendUnknown = async () => {
    if (!unknownImage)
      unknownImage = await axios.get(unknownImageUrl);
    send(res, 200, await Promise.resolve(unknownImage.data));
  }

  if (req.url === "/favicon.ico") {
    send(res, 200, await Promise.resolve("Favicon not available."));
    return;
  }

  let packageName = req.url.substring(1);

  let targetTag = `latest`;
  if (packageName.lastIndexOf('@') > 0) {
    targetTag = packageName.substring(packageName.lastIndexOf('@') + 1);
    packageName = packageName.substring(0, packageName.lastIndexOf('@'));
  }

  const versionRequestUrl = `${
    process.env.ARTIFACTORY_BADGE_URI
  }${encodeURIComponent(packageName)}`;

  const versionRequestConfig = {
    auth: {
      username: process.env.ARTIFACTORY_BADGE_USERNAME,
      password: process.env.ARTIFACTORY_BADGE_PASSWORD
    }
  };

  let versionRequest;

  try {
    versionRequest = await axios.get(
      versionRequestUrl,
      versionRequestConfig
    );
  } catch (error) {
    return await sendUnknown();
  }

  const tags = versionRequest.data["dist-tags"];

  if (!tags) {
    await sendUnknown()
    return;
  }

  const latestDistVersion = tags[targetTag] || targetTag;
  if (!semver.valid(latestDistVersion))
    return await sendUnknown();

  const version = latestDistVersion.replace(/-/gi, "--");
  const imageUrl = `https://img.shields.io/badge/version-${version}-green.svg?style=flat-square`;
  if(cacheBadgeData[version] === undefined)
    cacheBadgeData[version] = (await axios.get(imageUrl)).data
  const img = cacheBadgeData[version]

  console.log(`${packageName}@${latestDistVersion}`)
  send(res, 200, await Promise.resolve(img));
  return;
};

module.exports = router(
  get("/:scope/:package", badgeRoute),
  get("/:scope", badgeRoute),
  get("/", rootRoute),
  get("/*", notFoundRoute)
);
