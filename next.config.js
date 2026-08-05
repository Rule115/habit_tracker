/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Modul native (pakai fs/node-gyp) hanya boleh berjalan di server.
  // Mencegah bcrypt terseret ke bundle client oleh Turbopack (Next 16).
  serverExternalPackages: ["bcrypt", "node-gyp-build"],
};

export default config;
