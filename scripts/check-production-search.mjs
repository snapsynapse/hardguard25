#!/usr/bin/env node
// Upstream: portfolio-search-indexing-audit contract v3.
// Decoder backport: upstream asset v7 (2026-11-08); local contract/adaptations retained.
// Release-triggered HTTP validation. Exit 2 means infrastructure is unavailable.
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { decode, parseSitemap, MAX_SITEMAP_BYTES } from './search-sitemap.mjs';

const CONFIG_ARG = process.argv.find(value => value.startsWith('--config='));
const BASE_ARG = process.argv.find(value => value.startsWith('--base='));
const JSON_OUTPUT = process.argv.includes('--json');
const ROOT = process.cwd();
let defects = 0;
let infrastructure = 0;

function report(kind, message) {
    if (kind === 'defect') defects++;
    else infrastructure++;
    console.error(`${kind === 'defect' ? 'LIVE' : 'NETWORK'}  ${message}`);
}

function loadConfig() {
    const configPath = path.resolve(ROOT, CONFIG_ARG ? CONFIG_ARG.slice(9) : 'search-audit.config.json');
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (![2, 3].includes(config.contractVersion)) throw new Error('contractVersion must be 2 or 3');
        const canonical = new URL(config.canonicalOrigin);
        if (canonical.protocol !== 'https:' || canonical.pathname !== '/' || canonical.hostname.startsWith('www.') || canonical.search || canonical.hash || canonical.username || canonical.password) {
            throw new Error('canonicalOrigin must be a bare HTTPS origin with trailing slash');
        }
        if (!config.outputDir || !Array.isArray(config.sitemaps) || !config.sitemaps.length) throw new Error('outputDir and sitemaps are required');
        for (const rule of config.redirects || []) {
            for (const value of [rule.from, rule.to]) {
                const url = new URL(value);
                if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid configured redirect URL');
            }
        }
        return { ...config, canonicalOrigin: canonical.href };
    } catch (error) {
        report('infrastructure', `configuration failed: ${error.message}`);
        return null;
    }
}

const config = loadConfig();
if (!config) {
    if (JSON_OUTPUT) console.log(JSON.stringify({ contractVersion: null, pages: 0, defects, infrastructure, collectionComplete: false }));
    process.exit(2);
}
const canonicalOrigin = new URL(config.canonicalOrigin);
let base;
try {
    base = new URL(BASE_ARG ? BASE_ARG.slice(7) : canonicalOrigin.href);
    if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('invalid base URL');
    if (!base.pathname.endsWith('/')) base.pathname += '/';
} catch (error) {
    report('infrastructure', `configuration failed: ${error.message}`);
    if (JSON_OUTPUT) console.log(JSON.stringify({ contractVersion: config.contractVersion, pages: 0, defects, infrastructure, collectionComplete: false }));
    process.exit(2);
}
const production = base.href === canonicalOrigin.href;
const redirectOrigins = new Set((config.redirects || []).flatMap(rule => [new URL(rule.from).origin, new URL(rule.to).origin]));
let collectionComplete = true;

async function discard(response) {
    try { await response.body?.cancel(); } catch { /* Discard errors do not change the observed response. */ }
}

async function request(input, allowedOrigins = new Set([base.origin])) {
    let current = new URL(input);
    const seen = new Set();
    for (let hop = 0; hop <= 5; hop++) {
        if (!['http:', 'https:'].includes(current.protocol) || current.username || current.password || !allowedOrigins.has(current.origin)) {
            report('defect', `refused unauthorized request ${current.href}`);
            return null;
        }
        if (seen.has(current.href)) { report('defect', `${input}: redirect loop`); return null; }
        seen.add(current.href);
        let response;
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                response = await fetch(current.href, {
                    redirect: 'manual',
                    headers: { 'user-agent': 'portfolio-search-contract/3' },
                    signal: AbortSignal.timeout(15000)
                });
                break;
            } catch (error) { lastError = error; }
        }
        if (!response) {
            report('infrastructure', `${current.href}: fetch failed after 3 attempts: ${lastError?.cause?.message || lastError?.message || 'unknown error'}`);
            return null;
        }
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('location');
            try {
                if (!location) throw new Error('missing Location');
                current = new URL(location, current);
            } catch (error) { report('defect', `${input}: invalid redirect: ${error.message}`); return null; }
            await discard(response);
            continue;
        }
        return { response, finalUrl: current.href };
    }
    report('defect', `${input}: more than 5 redirects`);
    return null;
}

function deployedUrl(canonical) {
    if (production) return canonical;
    const url = new URL(canonical);
    return new URL(url.pathname.replace(/^\//, '') + url.search, base).href;
}

function false404(body, url) {
    for (const pattern of config.hosted404Patterns || []) {
        if (body.toLowerCase().includes(String(pattern).toLowerCase())) {
            report('defect', `${url}: response contains hosted 404 marker ${JSON.stringify(pattern)}`);
            return true;
        }
    }
    return false;
}

async function fetchText(url, rule = {}) {
    const result = await request(url);
    if (!result) { collectionComplete = false; return null; }
    const { response, finalUrl } = result;
    if (!response.ok) {
        const kind = response.status === 429 || response.status >= 500 ? 'infrastructure' : 'defect';
        report(kind, `${url}: HTTP ${response.status}`);
        collectionComplete = false;
        await discard(response);
        return null;
    }
    let body;
    try {
        const contentLength = Number(response.headers.get('content-length'));
        if (contentLength > MAX_SITEMAP_BYTES) throw new Error('response exceeds 50 MiB');
        if (response.body?.getReader) {
            const reader = response.body.getReader();
            const chunks = [];
            let bytes = 0;
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    bytes += value.byteLength;
                    if (bytes > MAX_SITEMAP_BYTES) throw new Error('response exceeds 50 MiB');
                    chunks.push(value);
                }
            } finally { await reader.cancel().catch(() => {}); }
            body = Buffer.concat(chunks).toString('utf8');
        } else body = await response.text();
        if (Buffer.byteLength(body) > MAX_SITEMAP_BYTES) throw new Error('response exceeds 50 MiB');
    } catch (error) {
        report('infrastructure', `${url}: body read failed: ${error.message}`);
        collectionComplete = false;
        return null;
    }
    const before = defects;
    const type = response.headers.get('content-type') || '';
    if (rule.contentTypes?.length && !rule.contentTypes.some(expected => type.toLowerCase().includes(expected.toLowerCase()))) {
        report('defect', `${url}: unexpected content-type ${type || '(missing)'}`);
    }
    for (const required of rule.contains || []) {
        if (!body.includes(required)) report('defect', `${url}: missing required text ${JSON.stringify(required)}`);
    }
    false404(body, url);
    return { response, body, type, finalUrl, valid: before === defects };
}

function readEntries(xml, source) {
    let parsed;
    try { parsed = parseSitemap(xml); }
    catch (error) { report('defect', `${source}: ${error.message}`); collectionComplete = false; return null; }
    for (const error of parsed.errors) report('defect', `${source}: ${error}`);
    if (parsed.errors.length) collectionComplete = false;
    return parsed;
}

function acceptedLocation(value, source, child = false) {
    let url;
    try { url = new URL(value); }
    catch { report('defect', `${source}: invalid location ${value}`); collectionComplete = false; return null; }
    if (url.origin !== canonicalOrigin.origin || url.href !== value || url.username || url.password || url.hash || (child && url.search)) {
        report('defect', `${source}: noncanonical location ${value}`);
        collectionComplete = false;
        return null;
    }
    return url;
}

const canonicals = new Set();
const seen = new Set();
async function fetchSitemap(canonical) {
    if (seen.has(canonical)) return;
    if (seen.size >= 1000) { report('defect', 'sitemap inventory exceeds 1000 files'); collectionComplete = false; return; }
    seen.add(canonical);
    const result = await fetchText(deployedUrl(canonical), { contentTypes: ['xml'] });
    if (!result) { collectionComplete = false; return; }
    if (!result.valid) collectionComplete = false;
    const parsed = readEntries(result.body, canonical);
    if (!parsed) return;
    for (const entry of parsed.entries) {
        const url = acceptedLocation(entry.loc, canonical, parsed.kind === 'sitemapindex');
        if (!url) continue;
        if (parsed.kind === 'sitemapindex') await fetchSitemap(url.href);
        else {
            canonicals.add(url.href);
            if (canonicals.size > 50000) { report('defect', 'page inventory exceeds 50000 URLs'); collectionComplete = false; return; }
        }
    }
}

for (const rule of config.requiredFiles || []) {
    await fetchText(new URL(rule.path.replace(/^\//, ''), base).href, rule);
}
for (const sitemap of config.sitemaps) {
    const url = new URL(sitemap.replace(/^\//, ''), canonicalOrigin);
    if (acceptedLocation(url.href, 'configuration', true)) await fetchSitemap(url.href);
}

function repositoryCanonicals() {
    const output = path.resolve(ROOT, config.outputDir);
    const urls = new Set();
    const visited = new Set();
    function parse(relative) {
        const file = path.resolve(output, relative);
        if (visited.has(file)) return;
        if (visited.size >= 1000) { report('defect', 'repository sitemap inventory exceeds 1000 files'); collectionComplete = false; return; }
        visited.add(file);
        if (!file.startsWith(output + path.sep)) { report('infrastructure', `repository sitemap escapes output directory: ${relative}`); collectionComplete = false; return; }
        let xml;
        try { xml = fs.readFileSync(file, 'utf8'); }
        catch (error) { report('infrastructure', `cannot read repository sitemap ${relative}: ${error.message}`); collectionComplete = false; return; }
        const parsed = readEntries(xml, relative);
        if (!parsed) return;
        for (const entry of parsed.entries) {
            const url = acceptedLocation(entry.loc, relative, parsed.kind === 'sitemapindex');
            if (!url) continue;
            if (parsed.kind === 'sitemapindex') parse(url.pathname.replace(/^\//, ''));
            else urls.add(url.href);
        }
    }
    for (const sitemap of config.sitemaps) parse(sitemap);
    return urls;
}

if (config.compareRepositorySitemaps !== false) {
    const repository = repositoryCanonicals();
    if (collectionComplete) {
        for (const canonical of repository) {
            if (!canonicals.has(canonical)) report('defect', `deployment sitemap is missing repository URL ${canonical}`);
        }
        for (const canonical of canonicals) {
            if (!repository.has(canonical)) report('defect', `deployment sitemap has URL absent from repository ${canonical}`);
        }
    }
}

function jsonLd(html, url) {
    const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    const pathname = new URL(url).pathname;
    const required = config.requireJsonLd === true || (config.jsonLdRequiredPaths || []).includes(pathname);
    if (!blocks.length && required) report('defect', `${url}: missing JSON-LD`);
    for (const block of blocks) {
        try { JSON.parse(block[1]); }
        catch (error) { report('defect', `${url}: invalid JSON-LD: ${error.message}`); }
    }
}

async function checkPage(canonical) {
    const target = deployedUrl(canonical);
    const result = await fetchText(target, { contentTypes: ['text/html'] });
    if (!result) return;
    if (result.finalUrl !== target) report('defect', `${target}: final URL is ${result.finalUrl}`);
    const html = result.body;
    const pageCanonical = decode(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
        || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1]);
    if (pageCanonical !== canonical) report('defect', `${target}: canonical ${pageCanonical || '(missing)'} does not equal ${canonical}`);
    if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
        report('defect', `${target}: sitemap page is noindex`);
    }
    jsonLd(html, target);
}

async function mapLimit(items, limit, fn) {
    let index = 0;
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (index < items.length) await fn(items[index++]);
    }));
}

await mapLimit([...new Set(canonicals)], 8, checkPage);

if (production) {
    for (const redirect of config.redirects || []) {
        const result = await request(redirect.from, redirectOrigins);
        if (result && result.finalUrl !== redirect.to) {
            report('defect', `${redirect.from}: final URL is ${result.finalUrl}, expected ${redirect.to}`);
        }
    }
}

const summary = {
    contractVersion: config.contractVersion,
    base: base.href,
    pages: canonicals.size,
    collectionComplete,
    defects,
    infrastructure
};
if (JSON_OUTPUT) console.log(JSON.stringify(summary));
else console.log(`check-production-search: ${summary.pages} sitemap pages at ${base.href}, ${defects} defects, ${infrastructure} infrastructure failures`);
process.exit(infrastructure ? 2 : defects ? 1 : 0);
