/**
 * Adds tools to the registry as stubs, greyed out until the code exists.
 *
 * Rerunnable: anything already in the registry is skipped, so this can be
 * pointed at a fresh list without checking by hand first.
 *
 * The rule for getting in is that it has to run in the browser, or on the one
 * container we already pay for. Anything needing a server of our own to answer
 * a question costs a request every time it is used and earns nothing, and a
 * page load is the billable event here.
 *
 * The domain checker is the exception that proves it works: RDAP, the registry
 * protocol that actually knows whether a name is taken, answers browsers
 * directly with an open CORS header. Checked before it was added rather than
 * assumed, because the whole tool depends on it.
 *
 * Run: node --experimental-strip-types scripts/add-batch.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src/lib/site.ts');

const TOOLS = [
  ['random-name-generator', 'Random name generator', 'Generators',
   'First names, surnames, or both, from anywhere.',
   'Random name generator',
   'Generate random names from a choice of regions, as first names, surnames or full names, one or a thousand at a time.'],

  ['business-name-generator', 'Business name generator', 'Generators',
   'Names for a thing you have not named yet.',
   'Business name generator',
   'Generate business name ideas from a word you start with, or from nothing at all, in several naming styles.'],

  ['fantasy-name-generator', 'Fantasy name generator', 'Generators',
   'For characters, places and things that do not exist.',
   'Fantasy name generator',
   'Generate names for characters, places, guilds and creatures, built from syllable patterns rather than a fixed list.'],

  ['address-generator', 'Address generator', 'Generators',
   'Fake addresses for filling a test database.',
   'Generate fake addresses for testing',
   'Generate addresses in the right shape for a country, for seeding a test database or filling a form while developing. Invented, not real, and not deliverable.'],

  ['domain-name-checker', 'Domain name checker', 'Web',
   'See whether a name is taken, across the endings.',
   'Check whether a domain name is available',
   'Check whether a domain is registered across com, net, org, io, xyz and more, asking the registries directly.'],

  ['domain-name-generator', 'Domain name generator', 'Web',
   'Ideas, with a word to start from or without one.',
   'Domain name idea generator',
   'Generate available domain name ideas from a seed word or from nothing, and check which ones are still free.'],

  ['tonic-solfa-converter', 'Tonic solfa converter', 'Media',
   'Note names into doh ray me, in any key.',
   'Convert note names to tonic solfa',
   'Convert note names into tonic solfa in whichever key you choose, and back the other way. For choirs, church music and anyone taught by solfa rather than staff.'],

  ['song-to-tonic-solfa', 'Song to tonic solfa', 'Media',
   'Hum or play a melody, read it back as solfa.',
   'Turn a melody into tonic solfa',
   'Work out the tonic solfa of a melody from a recording, by following the pitch. Works on one line at a time: a voice, a whistle, a single instrument.'],

  ['video-to-mp3', 'Video to MP3', 'Media',
   'Keep the sound, drop the picture.',
   'Extract the audio from a video as MP3',
   'Pull the audio out of a video file and save it as an MP3, choosing the quality.'],

  ['mp3-to-video', 'MP3 to video', 'Media',
   'A track plus a still, for somewhere that only takes video.',
   'Turn an MP3 into a video file',
   'Make a video from an audio file and a still picture, for uploading a track somewhere that only accepts video.'],
];

const source = readFileSync(file, 'utf8');
const already = new Set([...source.matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => m[1]));

const wanted = TOOLS.filter(([slug]) => !already.has(slug));
const skipped = TOOLS.length - wanted.length;

const blocks = wanted.map(
  ([slug, name, category, blurb, title, description]) => `  {
    slug: '${slug}',
    name: '${name}',
    category: '${category}',
    blurb: '${blurb.replace(/'/g, "\\'")}',
    title: '${title.replace(/'/g, "\\'")}',
    description:
      '${description.replace(/'/g, "\\'")}',
    live: false,
  },`,
);

if (blocks.length === 0) {
  console.log(`nothing to add, all ${TOOLS.length} slugs are already in the registry`);
} else {
  const anchor = "  {\n    slug: 'docx-viewer',";
  if (!source.includes(anchor)) throw new Error('anchor not found in site.ts');
  writeFileSync(file, source.replace(anchor, blocks.join('\n') + '\n\n' + anchor), 'utf8');
  console.log(`added ${blocks.length} stubs${skipped ? `, skipped ${skipped} already present` : ''}`);
  for (const b of blocks) console.log('  ' + /slug: '([a-z0-9-]+)'/.exec(b)[1]);
}
