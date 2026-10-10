// Build an installable Android APK on this computer (no EAS, no upload).
// Needs Java 17 and the Android SDK (easiest: install Android Studio). See README, step 5.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const run = (cmd, cwd = '.') => execSync(cmd, { stdio: 'inherit', cwd });

if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  console.warn('\nWarning: ANDROID_HOME is not set. Install Android Studio and set ANDROID_HOME to its SDK folder (see README).\n');
}

// 1. Generate the native Android project from app.json (the android/ folder is not committed).
run('npx expo prebuild -p android');

// 2. Compile a release APK with Gradle.
run(process.platform === 'win32' ? 'gradlew.bat assembleRelease' : './gradlew assembleRelease', 'android');

const apk = path.join('android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
console.log(existsSync(apk) ? `\nDone! Your APK: ${path.resolve(apk)}\n` : '\nBuild finished, but the APK was not found where expected.\n');
