// Shown on the tool page and published as FAQPage structured data, so the two never disagree.
export const FAQ = [
  {
    q: 'Is it free?',
    a: 'Yes. Upload a song and get the tonic solfa, the player and every download at no cost.',
  },
  {
    q: 'Which songs work best?',
    a: 'Songs with one clear lead singer. It writes the tune the lead voice sings, with the chords underneath. Choir harmonies and backing vocals are not written out, and sections with no singing, such as a keyboard intro, show chords only.',
  },
  {
    q: 'How accurate is it?',
    a: 'It is automatic, so expect some wrong notes, most often where the singer slides, ornaments or sings very fast. Check it by ear: the player can play the detected notes next to the song. If the key sounds wrong, change do and every syllable updates at once.',
  },
  {
    q: 'What does "do = G" mean?',
    a: 'Tonic solfa is movable: do is the home note of the song, and it can be any key. "do = G" means play do on G, re on A, mi on B and so on. The key to press is written under every syllable, so you never have to work it out.',
  },
  {
    q: 'Why are some syllables underlined?',
    a: 'Singers often slide into a note, which can sound like a sharp or flat. The tool writes the note the singer was aiming for and underlines it. Choose "Exact, as sung" in the settings to see what was actually sung.',
  },
  {
    q: 'Can I print it or open it in MuseScore?',
    a: 'Yes. Print the solfa or save it as a PDF, download it as text to send on WhatsApp, or download MIDI or MusicXML for keyboards and notation programs. Staff notation is there too, with the rhythm estimated from the beat.',
  },
  {
    q: 'Is my song shared with anyone?',
    a: 'No. Your song is kept on the server only so the player can play it back, and it is not listed anywhere public. Only someone with the link to it can open it, and you can delete it from Your songs at any time.',
  },
] as const;
