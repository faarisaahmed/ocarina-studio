// Song library.
//  - GAME_SONGS: the 12 ocarina melodies as button sequences (rhythms approximate).
//  - CLASSIC_SONGS: public-domain melodies, written in plain note names and
//    auto-transposed into the ocarina's range (B3–F5).
//  - EXERCISES: drills for the modifiers and the stick.
// Your own songs (typed in or recorded) are kept in localStorage.

export const GAME_SONGS = [
  { id: 'zelda', title: "Zelda's Lullaby", group: 'Melody', seq: ['cl', 'cu', 'cr', 'cl', 'cu', 'cr'], beats: [2, 1, 3, 2, 1, 3], bpm: 100,
    desc: 'The royal family\'s song. Opens doors marked with the royal crest.' },
  { id: 'epona', title: "Epona's Song", group: 'Melody', seq: ['cu', 'cl', 'cr', 'cu', 'cl', 'cr'], beats: [1, 1, 4, 1, 1, 4], bpm: 150,
    desc: 'Calls your horse and calms livestock.' },
  { id: 'saria', title: "Saria's Song", group: 'Melody', seq: ['cd', 'cr', 'cl', 'cd', 'cr', 'cl'], beats: [0.5, 0.5, 1, 0.5, 0.5, 1.5], bpm: 130,
    desc: 'A cheerful forest tune. Lets you talk to an old friend from afar.' },
  { id: 'sun', title: "Sun's Song", group: 'Melody', seq: ['cr', 'cd', 'cu', 'cr', 'cd', 'cu'], beats: [0.5, 0.5, 2, 0.5, 0.5, 2.5], bpm: 120,
    desc: 'Turns night into day, and day into night.' },
  { id: 'time', title: 'Song of Time', group: 'Melody', seq: ['cr', 'a', 'cd', 'cr', 'a', 'cd'], beats: [1, 2, 1, 1, 2, 2], bpm: 92,
    desc: 'Moves time-touched blocks. The heart of the story.' },
  { id: 'storms', title: 'Song of Storms', group: 'Melody', seq: ['a', 'cd', 'cu', 'a', 'cd', 'cu'], beats: [0.5, 0.5, 2, 0.5, 0.5, 2.5], bpm: 150,
    desc: 'Brings the rain. Learned from a grumpy windmill man.' },
  { id: 'minuet', title: 'Minuet of Forest', group: 'Warp', seq: ['a', 'cu', 'cl', 'cr', 'cl', 'cr'], beats: [1, 1, 0.5, 0.5, 1, 2], bpm: 120,
    desc: 'Warps to the forest temple meadow.' },
  { id: 'bolero', title: 'Bolero of Fire', group: 'Warp', seq: ['cd', 'a', 'cd', 'a', 'cr', 'cd', 'cr', 'cd'], beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2], bpm: 140,
    desc: 'Warps to the volcano crater.' },
  { id: 'serenade', title: 'Serenade of Water', group: 'Warp', seq: ['a', 'cd', 'cr', 'cr', 'cl'], beats: [1, 1, 2, 1, 3], bpm: 100,
    desc: 'Warps to the frozen lake shore.' },
  { id: 'nocturne', title: 'Nocturne of Shadow', group: 'Warp', seq: ['cl', 'cr', 'cr', 'a', 'cl', 'cr', 'cd'], beats: [1, 1, 1, 2, 1, 1, 3], bpm: 104,
    desc: 'Warps to the graveyard.' },
  { id: 'requiem', title: 'Requiem of Spirit', group: 'Warp', seq: ['a', 'cd', 'a', 'cr', 'cd', 'a'], beats: [2, 1, 1, 2, 1, 3], bpm: 112,
    desc: 'Warps to the desert colossus.' },
  { id: 'prelude', title: 'Prelude of Light', group: 'Warp', seq: ['cu', 'cr', 'cu', 'cr', 'cl', 'cu'], beats: [1, 2, 0.5, 0.5, 1, 3], bpm: 120,
    desc: 'Warps to the temple of time.' },
];

export const CLASSIC_SONGS = [
  { id: 'ode', title: 'Ode to Joy', by: 'Beethoven, 1824', bpm: 120, text: `
    E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:0.5 D4:2 |
    E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2 |
    D4 D4 E4 C4 | D4 E4:0.5 F4:0.5 E4 C4 | D4 E4:0.5 F4:0.5 E4 D4 | C4 D4 G3:2 |
    E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2` },
  { id: 'greensleeves', title: 'Greensleeves', by: 'Traditional English', bpm: 96, text: `
    A4:0.5 | C5 D5:0.5 E5:0.75 F5:0.25 E5:0.5 | D5 B4:0.5 G4:0.75 A4:0.25 B4:0.5 | C5 A4:0.5 A4:0.75 G#4:0.25 A4:0.5 | B4 G#4:0.5 E4 A4:0.5 |
    C5 D5:0.5 E5:0.75 F5:0.25 E5:0.5 | D5 B4:0.5 G4:0.75 A4:0.25 B4:0.5 | C5:0.75 B4:0.25 A4:0.5 G#4:0.75 F#4:0.25 G#4:0.5 | A4:1.5 A4:1 r:0.5 |
    G5:1.5 G5:0.75 F#5:0.25 E5:0.5 | D5 B4:0.5 G4:0.75 A4:0.25 B4:0.5 | C5 A4:0.5 A4:0.75 G#4:0.25 A4:0.5 | B4 G#4:0.5 E4:1.5 |
    G5:1.5 G5:0.75 F#5:0.25 E5:0.5 | D5 B4:0.5 G4:0.75 A4:0.25 B4:0.5 | C5:0.75 B4:0.25 A4:0.5 G#4:0.75 F#4:0.25 G#4:0.5 | A4:2.5` },
  { id: 'scarborough', title: 'Scarborough Fair', by: 'Traditional English', bpm: 110, text: `
    D4:2 D4 | A4:2 A4 | E4:1.5 F4:0.5 E4 | D4:3 | r A4 C5 | D5:2 C5 | A4 B4 G4 | A4:3 | r:2 D5 |
    D5:2 D5 | C5:2 A4 | A4 G4 F4 | E4 C4:2 | D4:2 A4 | G4:2 F4 | E4 D4 C4 | D4:3` },
  { id: 'amazing', title: 'Amazing Grace', by: 'Traditional (“New Britain”)', bpm: 84, text: `
    D4 | G4:2 B4:0.5 G4:0.5 | B4:2 A4 | G4:2 E4 | D4:2 D4 | G4:2 B4:0.5 G4:0.5 | B4:2 A4 | D5:3 | r:2 B4 |
    D5:1.5 B4:0.5 D5:0.5 B4:0.5 | G4:2 D4 | E4:1.5 G4:0.5 G4:0.5 E4:0.5 | D4:2 D4 | G4:2 B4:0.5 G4:0.5 | B4:2 A4 | G4:3` },
  { id: 'furelise', title: 'Für Elise (opening)', by: 'Beethoven, 1810', bpm: 72, text: `
    E5:0.5 D#5:0.5 | E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 | A4:1.5 C4:0.5 E4:0.5 A4:0.5 | B4:1.5 E4:0.5 G#4:0.5 B4:0.5 | C5:1.5 E4:0.5 E5:0.5 D#5:0.5 |
    E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 | A4:1.5 C4:0.5 E4:0.5 A4:0.5 | B4:1.5 E4:0.5 C5:0.5 B4:0.5 | A4:2` },
  { id: 'mountainking', title: 'In the Hall of the Mountain King', by: 'Grieg, 1875', bpm: 116, text: `
    A3:0.5 B3:0.5 C4:0.5 D4:0.5 E4:0.5 C4:0.5 E4 | D#4:0.5 B3:0.5 D#4 D4:0.5 Bb3:0.5 D4 |
    A3:0.5 B3:0.5 C4:0.5 D4:0.5 E4:0.5 C4:0.5 E4:0.5 A4:0.5 | G4:0.5 E4:0.5 C4:0.5 E4:0.5 G4:2` },
  { id: 'morning', title: 'Morning Mood', by: 'Grieg, 1875', bpm: 66, text: `
    G5:0.5 E5:0.5 D5:0.5 C5:0.5 D5:0.5 E5:0.5 | G5:0.5 E5:0.5 D5:0.5 C5:0.25 D5:0.25 E5:0.25 D5:0.25 E5:0.5 |
    G5:0.5 E5:0.5 G5:0.5 A5:0.5 E5:0.5 A5:0.5 | G5:0.5 E5:0.5 D5:0.5 C5:1.5` },
  { id: 'brahms', title: 'Lullaby (Wiegenlied)', by: 'Brahms, 1868', bpm: 92, text: `
    E4:0.5 E4:0.5 | G4:2 E4:0.5 E4:0.5 | G4:2 E4:0.5 G4:0.5 | C5 B4:1.5 A4:0.5 | A4 G4 D4:0.5 E4:0.5 |
    F4 D4 D4:0.5 E4:0.5 | F4:2 D4:0.5 F4:0.5 | B4:0.5 A4:0.5 G4 B4 | C5:2 C4:0.5 C4:0.5 |
    C5:2 A4:0.5 F4:0.5 | G4:2 E4:0.5 C4:0.5 | F4 G4 A4 | G4:2 C4:0.5 C4:0.5 |
    C5:2 A4:0.5 F4:0.5 | G4:2 E4:0.5 C4:0.5 | F4 E4 D4 | C4:3` },
  { id: 'canon', title: 'Canon in D (theme)', by: 'Pachelbel, c. 1700', bpm: 76, text: `
    F#5:2 E5:2 | D5:2 C#5:2 | B4:2 A4:2 | B4:2 C#5:2 |
    D5 C#5 B4 A4 | G4 F#4 G4 E4 | D4 F#4 A4 G4 | F#4 D4 F#4 E4 | D4 E4 F#4 G4 | A4:4` },
  { id: 'auldlang', title: 'Auld Lang Syne', by: 'Traditional Scottish', bpm: 92, text: `
    C4 | F4:1.5 F4:0.5 F4 A4 | G4:1.5 F4:0.5 G4 A4:0.5 G4:0.5 | F4:1.5 F4:0.5 A4 C5 | D5:3 D5 |
    C5:1.5 A4:0.5 A4 F4 | G4:1.5 F4:0.5 G4 A4:0.5 G4:0.5 | F4:1.5 D4:0.5 D4 C4 | F4:3` },
  { id: 'saints', title: 'When the Saints Go Marching In', by: 'Traditional', bpm: 168, text: `
    C4 E4 F4 | G4:4 | r C4 E4 F4 | G4:4 | r C4 E4 F4 | G4:2 E4:2 | C4:2 E4:2 | D4:4 |
    r E4 E4 D4 | C4:3 C4 | E4:2 G4:2 | G4 F4:3 | r E4 F4 G4:2 | E4:2 C4:2 | D4:2 C4:4` },
  { id: 'jingle', title: 'Jingle Bells (chorus)', by: 'Pierpont, 1857', bpm: 150, text: `
    E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:0.5 | E4:4 | F4 F4 F4:1.5 F4:0.5 | F4 E4 E4 E4:0.5 E4:0.5 | E4 D4 D4 E4 | D4:2 G4:2 |
    E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:0.5 | E4:4 | F4 F4 F4:1.5 F4:0.5 | F4 E4 E4 E4:0.5 E4:0.5 | G4 G4 F4 D4 | C4:4` },
  { id: 'carol', title: 'Carol of the Bells (ostinato)', by: 'Leontovych, 1914', bpm: 132, text: `
    Bb4 A4:0.5 Bb4:0.5 G4 | Bb4 A4:0.5 Bb4:0.5 G4 | Bb4 A4:0.5 Bb4:0.5 G4 | Bb4 A4:0.5 Bb4:0.5 G4 |
    D5 C5:0.5 D5:0.5 Bb4 | D5 C5:0.5 D5:0.5 Bb4 | D5 C5:0.5 D5:0.5 Bb4 | D5 C5:0.5 D5:0.5 Bb4 |
    G4:0.5 G4:0.5 G4:0.5 G4:0.5 G4:0.5 G4:0.5 | F4:0.5 F4:0.5 F4:0.5 F4:0.5 F4:0.5 F4:0.5 | Eb4:0.5 Eb4:0.5 Eb4:0.5 Eb4:0.5 Eb4:0.5 Eb4:0.5 | D4:0.5 D4:0.5 D4:0.5 D4:0.5 D4:0.5 D4:0.5 | G4:3` },
  { id: 'twinkle', title: 'Twinkle, Twinkle, Little Star', by: 'Traditional French', bpm: 110, text: `
    C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2 | G4 G4 F4 F4 | E4 E4 D4:2 |
    G4 G4 F4 F4 | E4 E4 D4:2 | C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2` },
  { id: 'frere', title: 'Frère Jacques', by: 'Traditional French', bpm: 120, text: `
    C4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4:2 | E4 F4 G4:2 |
    G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 | G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 | C4 G3 C4:2 | C4 G3 C4:2` },
  { id: 'birthday', title: 'Happy Birthday', by: 'Hill sisters, 1893', bpm: 100, text: `
    G4:0.75 G4:0.25 | A4 G4 C5 | B4:2 G4:0.75 G4:0.25 | A4 G4 D5 | C5:2 G4:0.75 G4:0.25 |
    G5 E5 C5 | B4 A4 F5:0.75 F5:0.25 | E5 C5 D5 | C5:3` },
];

export const EXERCISES = [
  { id: 'ex-naturals', title: 'The five natural notes', by: 'Warm-up', bpm: 96, fixed: true,
    desc: 'Just the five buttons, up and back down. Get the layout into your fingers.',
    text: 'D4 F4 A4 B4 D5:2 B4 A4 F4 D4:2' },
  { id: 'ex-halfsteps', title: 'Half steps with the modifiers', by: 'Modifiers', bpm: 84, fixed: true,
    desc: 'Every natural note, then the same note with the sharp modifier held.',
    text: 'D4 D#4 F4 F#4 A4 A#4 B4 C5 D5 D#5:2 r D5 C#5 B4 A#4 A4 G#4 F4 E4 D4 C#4:2' },
  { id: 'ex-g', title: 'Finding G', by: 'Stick', bpm: 72, fixed: true,
    desc: 'G is the only note in the middle of the range that needs the stick: F with a full tilt up, or A with a full tilt down.',
    text: 'F4 G4 A4 G4 F4 G4:2 r A4 G4 F#4 G4:2' },
  { id: 'ex-dmajor', title: 'D major scale', by: 'Scales', bpm: 92, fixed: true,
    desc: 'D E F♯ G A B C♯ D. It uses the sharp modifier, a full stick tilt, and one flat.',
    text: 'D4 E4 F#4 G4 A4 B4 C#5 D5:2 C#5 B4 A4 G4 F#4 E4 D4:2' },
  { id: 'ex-chromatic', title: 'Full chromatic range', by: 'Range', bpm: 112, fixed: true,
    desc: 'All 19 pitches from low B to high F, up and down. The ends need a modifier and a full tilt together.',
    text: 'B3 C4 C#4 D4 D#4 E4 F4 F#4 G4 G#4 A4 A#4 B4 C5 C#5 D5 D#5 E5 F5:2 E5 D#5 D5 C#5 C5 B4 A#4 A4 G#4 G4 F#4 F4 E4 D#4 D4 C#4 C4 B3:2' },
];
