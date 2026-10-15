"""Make the game's sound effects and background music from scratch (no samples, nothing to license).

    python3 scripts/make-sounds.py          (needs numpy and ffmpeg)

Writes small mono WAV effects to assets/sounds/ and an AAC music loop to assets/sounds/music-*.m4a.
Every sound is soft and short on purpose: the game is for young children, often played with a parent nearby.
"""

import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 22050
OUT = Path(__file__).resolve().parent.parent / "assets" / "sounds"
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(sec * SR)) / SR


def hz(name):
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    k = names[name[0]] + (1 if "#" in name else 0) + 12 * (int(name[-1]) + 1)
    return 440 * 2 ** ((k - 69) / 12)


def env(x, attack=0.004, decay=8.0):
    return np.minimum(1, x / attack) * np.exp(-x * decay)


def bell(f, length=0.5, decay=7.0):
    x = t(length)
    return env(x, decay=decay) * (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x * 10) + 0.12 * np.sin(2 * np.pi * 4.01 * f * x) * np.exp(-x * 18))


def marimba(f, length=0.4):
    x = t(length)
    return env(x, attack=0.002, decay=11) * (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * 4 * f * x) * np.exp(-x * 30))


def sweep(f0, f1, length, decay=6.0):
    x = t(length)
    f = np.linspace(f0, f1, len(x))
    return env(x, decay=decay) * np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(length, decay=30.0, smooth=1):
    x = t(length)
    n = rng.standard_normal(len(x))
    if smooth > 1:
        n = np.convolve(n, np.ones(smooth) / smooth, "same")
    return n * env(x, attack=0.002, decay=decay)


def mix(*parts):
    """parts: (signal, start_seconds, gain)"""
    end = max(int(s * SR) + len(sig) for sig, s, _ in parts)
    out = np.zeros(end)
    for sig, s, g in parts:
        i = int(s * SR)
        out[i : i + len(sig)] += sig * g
    return out


def save(name, sig, peak=0.7):
    sig = sig / (np.abs(sig).max() or 1) * peak
    fade = min(len(sig), int(0.01 * SR))
    sig[-fade:] *= np.linspace(1, 0, fade)
    pcm = (sig * 32767).astype("<i2")
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def effects():
    save("tap", sweep(900, 600, 0.07, decay=40), peak=0.45)
    save("pick", sweep(420, 760, 0.12, decay=14), peak=0.4)
    save("snap", mix((noise(0.03, decay=120, smooth=3), 0, 0.5), (bell(hz("E6"), 0.35), 0.01, 0.7), (bell(hz("B6"), 0.35), 0.06, 0.45)), peak=0.6)
    save("miss", mix((sweep(330, 300, 0.16, decay=10), 0, 1), (sweep(262, 230, 0.2, decay=9), 0.13, 1)), peak=0.4)
    save("flip", noise(0.1, decay=35, smooth=6), peak=0.35)
    save("match", mix((bell(hz("E6"), 0.45), 0, 1), (bell(hz("G6"), 0.45), 0.09, 1), (bell(hz("C7"), 0.6), 0.18, 0.9)), peak=0.6)
    save("click", mix((noise(0.02, decay=200, smooth=2), 0, 1), (marimba(hz("A5"), 0.08), 0, 0.5)), peak=0.4)
    puff = noise(0.18, decay=14, smooth=10)
    whistle = sweep(hz("A5"), hz("A5"), 0.5, decay=2) + 0.6 * sweep(hz("C#6"), hz("C#6"), 0.5, decay=2)
    save("train", mix((puff, 0, 1), (puff, 0.2, 0.8), (whistle, 0.42, 0.5)), peak=0.55)
    save("step", mix((marimba(hz("G4"), 0.08), 0, 1), (noise(0.03, decay=90, smooth=8), 0, 0.3)), peak=0.3)
    save("bump", mix((sweep(180, 110, 0.15, decay=18), 0, 1), (noise(0.05, decay=60, smooth=12), 0, 0.5)), peak=0.45)
    save("collect", mix(*[(bell(hz(n), 0.3, decay=10), i * 0.06, 0.8) for i, n in enumerate(["C6", "E6", "G6", "C7"])]), peak=0.55)
    save("slide", noise(0.14, decay=22, smooth=14), peak=0.3)
    for i, n in enumerate(["C6", "E6", "G6"]):
        save(f"star{i + 1}", mix((bell(hz(n), 0.5), 0, 1), (noise(0.03, decay=100, smooth=2), 0, 0.2)), peak=0.55)
    fanfare = mix(
        *[(marimba(hz(n), 0.3), i * 0.11, 0.9) for i, n in enumerate(["C5", "E5", "G5", "C6"])],
        *[(bell(hz(n), 1.4, decay=2.5), 0.48, 0.5) for n in ["C5", "E5", "G5", "C6"]],
        *[(bell(hz(n), 0.25, decay=14), 0.6 + i * 0.07, 0.25) for i, n in enumerate(["E7", "G7", "C8", "G7", "E7"])],
    )
    save("cheer", fanfare, peak=0.6)

    # Bit the robot: square-ish bleeps (a sine with a little of its 3rd harmonic), always friendly.
    def bleep(f, length=0.09):
        x = t(length)
        return env(x, attack=0.003, decay=18) * (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * 3 * f * x))

    save("bit-think", mix(*[(bleep(f), i * 0.11, 1) for i, f in enumerate([880, 1175, 988, 1319, 1047])]), peak=0.35)
    save("bit-yes", mix((bleep(784, 0.12), 0, 1), (bleep(1047, 0.12), 0.1, 1), (bleep(1568, 0.22), 0.2, 1)), peak=0.45)
    save("bit-oops", mix((sweep(660, 520, 0.18, decay=8), 0, 1), (sweep(500, 330, 0.3, decay=6), 0.16, 1)), peak=0.4)
    save("drop", mix((noise(0.05, decay=60, smooth=10), 0, 0.6), (marimba(hz("C5"), 0.2), 0.01, 0.8)), peak=0.45)


def music_town(path, bars=16, bpm=100):
    """A gentle looping tune: marimba melody, soft plucked chords, bass, no drums. Loops seamlessly."""
    beat = 60 / bpm
    bar = 4 * beat
    total = int(bars * bar * SR)
    out = np.zeros(total)

    def add(sig, at, gain):
        i = int(at * SR) % total
        n = len(sig)
        first = min(n, total - i)
        out[i : i + first] += sig[:first] * gain
        if n > first:  # wrap the tail around to the start, so the loop has no seam
            out[: n - first] += sig[first:] * gain

    chords = {"C": ["C", "E", "G"], "G": ["G", "B", "D"], "Am": ["A", "C", "E"], "F": ["F", "A", "C"]}
    roots = {"C": "C3", "G": "G2", "Am": "A2", "F": "F2"}
    prog = ["C", "G", "Am", "F", "C", "F", "G", "C"] * 2
    melody = {
        "C": [(0, "E5"), (1, "G5"), (2, "E5"), (3, "D5")],
        "G": [(0, "D5"), (1.5, "B4"), (2, "D5"), (3, "G5")],
        "Am": [(0, "C5"), (1, "E5"), (2, "A5"), (3, "G5")],
        "F": [(0, "A5"), (1, "F5"), (2, "C5"), (2.5, "D5")],
    }
    for k, ch in enumerate(prog):
        t0 = k * bar
        for b in (0, 2):
            for j, n in enumerate(chords[ch]):
                add(marimba(hz(n + "4"), 0.5), t0 + b * beat + j * 0.02, 0.18)
        add(bell(hz(roots[ch]), 0.9, decay=3), t0, 0.35)
        for b, n in melody[ch]:
            add(marimba(hz(n), 0.45), t0 + b * beat, 0.32 if k < 8 else 0.26)
        if k >= 8:  # second half: a soft bell countermelody
            add(bell(hz(chords[ch][0] + "6"), 0.6, decay=5), t0 + 1.5 * beat, 0.12)
    out = out / np.abs(out).max() * 0.6
    wav = OUT / "_music.wav"
    pcm = (out * 32767).astype("<i2")
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-c:a", "aac", "-b:a", "64k", str(path)], check=True)
    wav.unlink()


def music_lab(path, bars=16, bpm=96):
    """Robo Lab: a calm, twinkly loop with soft bleepy arpeggios over warm pads."""
    beat = 60 / bpm
    bar = 4 * beat
    total = int(bars * bar * SR)
    out = np.zeros(total)

    def add(sig, at, gain):
        i = int(at * SR) % total
        n = len(sig)
        first = min(n, total - i)
        out[i : i + first] += sig[:first] * gain
        if n > first:
            out[: n - first] += sig[first:] * gain

    def pad(f, length):
        x = t(length)
        e = np.minimum(1, x / 0.4) * np.minimum(1, (length - x) / 0.5)
        return e * (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * 2.003 * f * x))

    chords = [["A", "C", "E"], ["F", "A", "C"], ["C", "E", "G"], ["G", "B", "D"]]
    for k in range(bars):
        ch = chords[k % 4]
        t0 = k * bar
        for n in ch:
            add(pad(hz(n + "3"), bar + 0.4), t0, 0.07)
        for b in range(8):  # eighth-note arpeggio, one octave up every other bar
            n = ch[[0, 1, 2, 1][b % 4]] + ("5" if (k // 2) % 2 else "4")
            add(bell(hz(n), 0.35, decay=12), t0 + b * beat / 2, 0.2 if b % 2 == 0 else 0.13)
        if k % 2 == 1:
            add(bell(hz(ch[2] + "6"), 0.8, decay=4), t0 + 2.5 * beat, 0.12)
    out = out / np.abs(out).max() * 0.6
    wav = OUT / "_music.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((out * 32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-c:a", "aac", "-b:a", "64k", str(path)], check=True)
    wav.unlink()


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    effects()
    music_town(OUT / "music-town.m4a")
    music_lab(OUT / "music-lab.m4a")
    for f in sorted(OUT.iterdir()):
        print(f"{f.name:22s} {f.stat().st_size // 1024:5d} KB")
