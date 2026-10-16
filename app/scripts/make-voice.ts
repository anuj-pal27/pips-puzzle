// Make the narrator's voice files (assets/voice/*.mp3) from the lines in src/data/voice.ts, with Sarvam AI's
// Bulbul text-to-speech: one cheerful female voice reading Hindi, Punjabi, Gujarati, Marathi, Malayalam,
// Tamil and Bengali. ffmpeg evens out their loudness and makes them small. Then writes src/audio/voiceClips.ts
// so the app can find them.
//
//   npm run voice            only lines that changed since last time
//   npm run voice -- --all   every line again
//
// The key comes from SARVAM_API_KEY, in the shell or in app/.env (git-ignored; Expo only bundles EXPO_PUBLIC_ ones).
// assets/voice/voice.json remembers what each file says, so unchanged lines aren't paid for twice.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { voiceScripts } from '../src/data/voice.ts';

const VOICE = { model: 'bulbul:v3', speaker: process.env.VOICE_SPEAKER ?? 'priya', pace: 0.9 };

const dir = new URL('../assets/voice/', import.meta.url);
const manifestFile = new URL('voice.json', dir);
const clipsFile = new URL('../src/audio/voiceClips.ts', import.meta.url);

const envFile = new URL('../.env', import.meta.url);
if (!process.env.SARVAM_API_KEY && existsSync(envFile)) process.loadEnvFile(envFile);
const key = process.env.SARVAM_API_KEY;
if (!key) {
  console.error('Put SARVAM_API_KEY=... in app/.env first (get a key at https://dashboard.sarvam.ai).');
  process.exit(1);
}

mkdirSync(dir, { recursive: true });
const manifest: Record<string, string> = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
const all = process.argv.includes('--all');

/** Every clip equally loud, and mono 48 kbps: plenty for a voice, a third of Sarvam's size. */
function shrink(audio: Buffer, out: URL) {
  const raw = fileURLToPath(out) + '.raw';
  writeFileSync(raw, audio);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-af', 'loudnorm=I=-16:TP=-1.5', '-ar', '24000', '-ac', '1', '-b:a', '48k', fileURLToPath(out)]);
  rmSync(raw);
}

const scripts = voiceScripts();

for (const { clip, lang, text } of scripts) {
  const hash = createHash('sha1').update(JSON.stringify({ ...VOICE, lang, text })).digest('hex').slice(0, 12);
  const file = new URL(`${clip}.mp3`, dir);
  if (!all && manifest[clip] === hash && existsSync(file)) continue;

  const res = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: { 'api-subscription-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      language_code: lang,
      model: VOICE.model,
      speaker: VOICE.speaker,
      pace: VOICE.pace,
      speech_sample_rate: 24000,
      output_audio_codec: 'mp3',
    }),
  });
  if (!res.ok) {
    console.error(`${clip}: Sarvam said ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const { audios } = (await res.json()) as { audios: string[] };
  const audio = Buffer.concat(audios.map((a) => Buffer.from(a, 'base64')));
  shrink(audio, file);
  manifest[clip] = hash;
  console.log(`${clip}.mp3 (${lang}, ${Math.round(readFileSync(file).length / 1024)} KB)`);
}

writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');

// Metro needs a require() it can see for every file, so list them in a module.
const made = scripts.filter((s) => existsSync(new URL(`${s.clip}.mp3`, dir)));
writeFileSync(
  clipsFile,
  [
    '// Made by `npm run voice` (scripts/make-voice.ts) from src/data/voice.ts. Don\'t edit by hand.',
    '',
    "import type { VoiceClip } from '@/data/voice';",
    '',
    'export const VOICE_CLIPS: Partial<Record<VoiceClip, number>> = {',
    ...made.map((s) => `  '${s.clip}': require('@/assets/voice/${s.clip}.mp3'),`),
    '};',
    '',
  ].join('\n'),
);
console.log(`src/audio/voiceClips.ts: ${made.length} of ${scripts.length} clips`);
