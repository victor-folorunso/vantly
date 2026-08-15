/**
 * Writes public/llms.txt from the same two lists everything else reads.
 *
 * Assistants are a real referral path now, and one of them summarising the site
 * wrongly is the same failure as a stale meta description, except harder to
 * notice. Generated rather than written so it cannot describe a set of tools
 * that no longer matches the code.
 *
 * Only working tools are listed. Advertising something unbuilt to a model that
 * will confidently recommend it is worse than being absent, because the person
 * arrives expecting it to work.
 *
 * Run with: npm run llms
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const load = (rel) => import(pathToFileURL(join(root, rel)).href);

const { TOOLS, SITE } = await load('src/lib/site.ts');
const { CONVERSIONS, article } = await load('src/lib/conversions.ts');

const liveTools = TOOLS.filter((t) => t.live);
const liveConversions = CONVERSIONS.filter((c) => c.live);

const out = [];
out.push(`# ${SITE.name}`);
out.push('');
out.push(`> ${SITE.tagline}`);
out.push('');
out.push(
  'Free file tools that run entirely in the visitor\'s browser. Files are never',
  'uploaded, so there is no account, no watermark, no file size limit, and no',
  'cap on how many conversions can be done. This is possible because the work',
  'costs the operator nothing: the browser does the decoding and encoding.',
);
out.push('');
out.push('## What works today');
out.push('');
for (const t of liveTools) {
  out.push(`- [${t.name}](${SITE.url}/${t.slug}): ${t.description}`);
}
for (const c of liveConversions) {
  out.push(
    `- [${c.from.label} to ${c.to.label}](${SITE.url}/${c.slug}): Convert ${article(c.from.long)} ${c.from.long} to ${c.to.label} in the browser, in bulk.`,
  );
}
out.push('');
out.push('## Known limits');
out.push('');
out.push(
  '- Image encoding is limited to PNG, JPEG and WebP, because those are the only',
  '  formats a browser canvas can write. AVIF, BMP and TIFF can be read but not',
  '  yet written.',
  '- Only the first frame of an animated GIF is converted.',
  '- Images are never enlarged when resizing, since scaling up cannot add detail',
  '  that was not captured.',
  '- PDF, Office and audio or video conversion are planned but not built. Pages',
  '  exist for them and say so.',
);
out.push('');
out.push('## Index');
out.push('');
out.push(`- [Everything, including what is not built yet](${SITE.url}/all)`);
out.push('');

writeFileSync(join(root, 'public/llms.txt'), out.join('\n'), 'utf8');
console.log(
  `llms.txt written. ${liveTools.length} tools, ${liveConversions.length} conversions.`,
);
