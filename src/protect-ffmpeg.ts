/* Copyright(C) 2017-2025, HJD (https://github.com/hjdhjd). All rights reserved.
 *
 * protect-ffmpeg.ts: Helpers to locate and provision FFmpeg binaries.
 */
/* eslint-disable sort-imports */
import ffmpegForHomebridge from "ffmpeg-for-homebridge";
import type { Logging } from "homebridge";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const fs = require("node:fs");
const FFMPEG_BINARY_NAMES = process.platform === "win32" ? [ "ffmpeg.exe", "ffmpeg" ] : ["ffmpeg"];

function locateBundledFfmpeg(): string | undefined {

  let ffmpegModulePath: string;

  try {

    ffmpegModulePath = require.resolve("ffmpeg-for-homebridge");
  } catch{

    return undefined;
  }

  const ffmpegDirectory = path.dirname(ffmpegModulePath);

  for(const binaryName of FFMPEG_BINARY_NAMES) {

    for(const candidate of [
      path.join(ffmpegDirectory, binaryName),
      path.join(ffmpegDirectory, "bin", binaryName)
    ]) {

      if(fs.existsSync(candidate)) {

        return candidate;
      }
    }
  }

  return undefined;
}

function runFfmpegInstaller(log: Logging): string | undefined {

  let installerPath: string;

  try {

    installerPath = require.resolve("ffmpeg-for-homebridge/install.js");
  } catch{

    log.warn("Unable to locate the ffmpeg-for-homebridge installer. Please reinstall the dependency or install FFmpeg manually.");

    return undefined;
  }

  log.info("Attempting to download the bundled FFmpeg binary. This may take a moment.");

  const installResult = spawnSync(process.execPath, [installerPath], { stdio: "inherit" });

  if(installResult.error) {

    log.error("FFmpeg download failed: %s", installResult.error.message);

    return undefined;
  }

  if(installResult.status !== 0) {

    log.error("FFmpeg download failed with exit code %s.", installResult.status ?? "null");

    return undefined;
  }

  return locateBundledFfmpeg();
}

export function resolveDefaultVideoProcessor(log: Logging): string | undefined {

  const dependencyBinary = ffmpegForHomebridge as (string | undefined);
  const bundledPath = dependencyBinary ?? locateBundledFfmpeg();

  if(bundledPath) {

    return bundledPath;
  }

  return runFfmpegInstaller(log);
}
