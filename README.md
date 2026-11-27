# Ocarina Studio

A browser ocarina built for game controllers. Play it the way you did in the N64 game, or with the Switch 2 remake layout. You get real pitch bending, vibrato, a 3D instrument and controller view, a song library with practice mode, and a full note chart.

**Play it:** https://faarisaahmed.github.io/ocarina-studio/

## Features

- **Two control schemes**
  - **N64 Original:** A plays D, and the C-buttons play F, A, B and high D. R is a half step up and Z is a half step down. The Control Stick bends up or down by up to a whole step, and tilting it sideways adds vibrato.
  - **Switch 2 Remake:** the notes are on L, R, A, Y and X. The D-pad moves up or down a half step, and the left stick bends and adds vibrato.
- **Controller support:** Xbox, PlayStation, Switch Pro, 8BitDo and other standard pads work automatically. For original **N64 controllers** on USB adapters (raphnet, Mayflash, NSO N64 and so on), use the built-in mapping wizard. It handles adapters that report C-buttons or triggers as axes, and it auto-calibrates short-throw N64 sticks.
- **Keyboard and touch:** Space ↓ → ← ↑ play the notes, R/Z are the half steps, W/S bend, and A/D add vibrato. There's also a multi-touch on-screen pad.
- **Large now-playing display** with bend, tuning and vibrato meters. It can expand to full screen.
- **Controller input panel:** a live table of every button, modifier and stick axis, showing which ones are pressed and which note is sounding.
- **Songs:** the ocarina melodies and warp songs are recognized whenever you play them. There's also a custom Scarecrow-style song, public-domain classics that are auto-transposed into range, and exercises. Each one has Listen and Practice modes.
- **Your own songs:** type them in with simple note syntax (`D4 F#4 G4:2 r Bb3:0.5`), or record them from what you play. You can import and export them as JSON.
- **Note chart:** all 19 reachable pitches (B3–F5), with every fingering for each one.
- **Tips and tricks** for playing well.

## Run locally

It's a static site with no build step:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Controllers only show up in the browser after you press a button on them.

## Credits

- All audio is synthesized in the browser with the Web Audio API.

Ocarina Studio is an unofficial fan project. It isn't affiliated with or endorsed by Nintendo. "Nintendo 64", "Nintendo Switch" and related names are trademarks of Nintendo.
