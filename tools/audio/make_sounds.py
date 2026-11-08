#!/usr/bin/env python3
"""Synthesize English Quest's original sound effects and village music (no samples, no copyright).

    python tools/audio/make_sounds.py

SFX -> assets/audio/sfx/*.wav (22.05 kHz mono), music -> assets/audio/music/village_theme.wav
(a 32-bar music-box tune in C major pentatonic over soft pad chords, loops seamlessly).
"""
import math, random, struct, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RATE = 22050


def write(path, samples):
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max(1e-6, max(abs(s) for s in samples))
    gain = 0.85 / peak
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s * gain)) * 32767)) for s in samples))
    print('wrote', path.relative_to(ROOT), round(len(samples) / RATE, 2), 's')


def freq(note):  # MIDI note -> Hz
    return 440.0 * 2 ** ((note - 69) / 12)


def bell(f, dur, decay=6.0, harm=(1, .45, .2), detune=0.0):
    n = int(dur * RATE)
    out = []
    for i in range(n):
        t = i / RATE
        env = math.exp(-decay * t) * min(1.0, t * 400)
        s = sum(a * math.sin(2 * math.pi * f * (k + 1) * (1 + detune * k) * t) for k, a in enumerate(harm))
        out.append(s * env)
    return out


def mix(dst, src, at, gain=1.0):
    start = int(at * RATE)
    for i, s in enumerate(src):
        j = start + i
        if j >= len(dst):
            break
        dst[j] += s * gain


def silence(sec):
    return [0.0] * int(sec * RATE)


def sfx():
    out = ROOT / 'assets/audio/sfx'
    # correct: two rising notes
    s = silence(.45); mix(s, bell(freq(76), .35), 0); mix(s, bell(freq(83), .35), .1); write(out / 'correct.wav', s)
    # wrong: soft low wobble (never harsh)
    n = int(.32 * RATE)
    write(out / 'wrong.wav', [math.sin(2 * math.pi * (180 - 60 * i / n) * i / RATE) * math.exp(-5 * i / RATE) * min(1, i / 200) for i in range(n)])
    # pickup: quick pop up
    n = int(.18 * RATE)
    write(out / 'pickup.wav', [math.sin(2 * math.pi * (520 + 900 * i / n) * i / RATE) * math.exp(-14 * i / RATE) for i in range(n)])
    # coin: bright double ding
    s = silence(.4); mix(s, bell(freq(88), .3, 9), 0, .8); mix(s, bell(freq(93), .3, 9), .07, .8); write(out / 'coin.wav', s)
    # tick: tiny click for buttons and letters
    write(out / 'tick.wav', bell(freq(96), .08, 40, (1, .2)))
    # fanfare: arpeggio C E G C'
    s = silence(1.2)
    for k, note in enumerate((72, 76, 79, 84)):
        mix(s, bell(freq(note), .9, 3.5), k * .12)
    write(out / 'fanfare.wav', s)


def music():
    random.seed(7)
    bpm = 96
    beat = 60 / bpm
    bars = 32
    total = bars * 4 * beat
    s = silence(total)
    chords = [(48, 52, 55), (45, 48, 52), (41, 45, 48), (43, 47, 50)]  # C  Am  F  G
    scale = [60, 62, 64, 67, 69, 72, 74, 76, 79]                       # C major pentatonic
    # gentle pad: one chord per bar, slow attack/release, fades before the loop point
    for bar in range(bars):
        ch = chords[bar % 4]
        t0 = bar * 4 * beat
        n = int(4 * beat * RATE)
        for i in range(n):
            t = i / RATE
            env = min(1.0, t / .6) * min(1.0, (4 * beat - t) / .6) * .16
            v = sum(math.sin(2 * math.pi * freq(m) * t) for m in ch)
            j = int(t0 * RATE) + i
            if j < len(s):
                s[j] += v * env
    # melody: phrases of 8 beats, stepwise walk on the pentatonic scale, music-box timbre
    idx = 4
    for bar in range(bars):
        for b8 in range(8):
            t = bar * 4 * beat + b8 * beat / 2
            if random.random() < (.55 if b8 % 2 else .85):
                idx = max(0, min(len(scale) - 1, idx + random.choice((-2, -1, -1, 0, 1, 1, 2))))
                if bar % 4 == 3 and b8 >= 6:
                    continue                                   # breathe at the end of each phrase
                note = scale[idx] + (12 if bar % 8 >= 4 and random.random() < .3 else 0)
                tail = total - t
                if tail < 1.2:
                    continue                                   # keep the loop seam clean
                mix(s, bell(freq(note), 1.1, 4.0, (1, .35, .12), .001), t, .5)
    write(ROOT / 'assets/audio/music/village_theme.wav', s)


if __name__ == '__main__':
    sfx()
    music()
