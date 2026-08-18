#!/usr/bin/env node
// Changing where the site is hosted should be one command, not an archaeology dig.
//
//   node scripts/set-site-url.mjs https://cupel.dev
//
// The repo is this project's permanent identity. The website is a satellite that
// may move between GitHub Pages, Vercel, or a custom domain. Every internal link
// in site/index.html is already relative, so the page itself is host-portable.
// Only the canonical URL needs stamping.

import { readFileSync, writeFileSync } from 'node:fs';

const raw = process.argv[2];
if (!raw) {
  console.error('usage: node scripts/set-site-url.mjs <url>');
  process.exit(1);
}

let url;
try {
  url = new URL(raw);
} catch {
  console.error(`not a valid URL: ${raw}`);
  process.exit(1);
}
if (url.protocol !== 'https:') {
  console.error('canonical URL must be https');
  process.exit(1);
}
// Canonical URLs are compared literally, so trailing-slash consistency matters.
const canonical = url.origin + (url.pathname === '/' ? '/' : url.pathname.replace(/\/?$/, '/'));

const edits = [];

// 1. The page's own canonical and og:url.
const pagePath = 'site/index.html';
let page = readFileSync(pagePath, 'utf8');
const before = page;
page = page.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`);
page = page.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`);
if (page !== before) {
  writeFileSync(pagePath, page);
  edits.push(pagePath);
}

// 2. The README's website link.
const readmePath = 'README.md';
let readme = readFileSync(readmePath, 'utf8');
const readmeBefore = readme;
readme = readme.replace(/\[Website\]\(https?:\/\/[^)]*\)/, `[Website](${canonical})`);
if (readme !== readmeBefore) {
  writeFileSync(readmePath, readme);
  edits.push(readmePath);
}

console.log(`canonical set to ${canonical}`);
console.log(edits.length ? `updated: ${edits.join(', ')}` : 'no files changed');
console.log('\nStill to do by hand (they live outside the repo):');
console.log(`  gh repo edit --homepage "${canonical}"`);
console.log('  point the host at this repo, or add the domain in the Vercel dashboard');
