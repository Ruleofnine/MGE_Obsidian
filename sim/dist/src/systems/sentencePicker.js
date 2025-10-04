"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomSentenceFromEpub = getRandomSentenceFromEpub;
exports.getAllEpubsInDir = getAllEpubsInDir;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const JSZip = __importStar(require("jszip"));
const P = path.posix;
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function htmlToPlainText(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function looksLikeFrontBackMatter(text) {
    const head = text.slice(0, 2000).toLowerCase();
    return [
        "table of contents",
        "contents",
        "copyright",
        "acknowledg",
        "colophon",
        "about the author",
        "about this book",
        "front matter",
        "back matter",
        "index",
        "dedication",
        "title page",
    ].some(k => head.includes(k));
}
function filenameIsNonChapter(fnLower) {
    console.log(fnLower);
    // exclude obvious non-reading files
    return /(nav|toc|ncx|cover|titlepage|title-page|copyright|colophon|acknowledg|dedication|frontmatter|backmatter|index|advert|promo|about)/.test(fnLower);
}
async function getRandomSentenceFromEpub(filePath) {
    try {
        const data = fs.readFileSync(filePath);
        const zip = await JSZip.loadAsync(data);
        // --- Find OPF ---
        let opfPath = null;
        const container = await zip.file("META-INF/container.xml")?.async("string");
        if (container) {
            const m = container.match(/full-path="([^"]+)"/);
            if (m)
                opfPath = m[1];
        }
        // Fallback: pick the first .opf we can find
        if (!opfPath) {
            opfPath =
                Object.keys(zip.files).find(f => f.toLowerCase().endsWith(".opf")) ?? null;
        }
        if (!opfPath) {
            // No OPF? Fallback to raw scan of html/xhtml
            return await randomSentenceByRawScan(zip);
        }
        const opfDir = P.dirname(opfPath);
        const opf = await zip.file(opfPath).async("string");
        // --- Parse manifest ---
        const manifest = {};
        const itemRe = /<item\b[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*media-type="([^"]+)"[^>]*?(?:properties="([^"]+)")?[^>]*\/?>/gi;
        let im;
        while ((im = itemRe.exec(opf))) {
            const [, id, href, media, props = ""] = im;
            manifest[id] = {
                href,
                media: media.toLowerCase(),
                props: props.toLowerCase(),
            };
        }
        const spineRefs = [];
        const itemrefRe = /<itemref\b[^>]*idref="([^"]+)"[^>]*?(?:properties="([^"]+)")?[^>]*?(?:linear="([^"]+)")?[^>]*\/?>/gi;
        let sr;
        while ((sr = itemrefRe.exec(opf))) {
            const [, idref, props = "", linear = "yes"] = sr;
            spineRefs.push({
                idref,
                props: props.toLowerCase(),
                linear: linear.toLowerCase() !== "no",
            });
        }
        // --- Build candidate files from spine ---
        let candidates = spineRefs
            .filter(s => s.linear)
            .map(s => manifest[s.idref])
            .filter(Boolean)
            .filter(item => /\.(xhtml|html)$/i.test(item.href))
            .filter(item => !item.props.includes("nav") &&
            !item.props.includes("cover-image") &&
            !item.props.includes("page-list"))
            .map(item => P.join(opfDir, item.href))
            .filter(fp => !filenameIsNonChapter(fp.toLowerCase()));
        // Fallback if too strict
        if (candidates.length === 0) {
            candidates = Object.keys(zip.files)
                .filter(f => /\.(xhtml|html)$/i.test(f))
                .filter(f => !filenameIsNonChapter(f.toLowerCase()));
        }
        if (candidates.length === 0) {
            return "⚠️ No HTML/XHTML reading files found.";
        }
        // Try a few random chapters until we get good sentences
        const maxTries = Math.min(10, candidates.length);
        for (let i = 0; i < maxTries; i++) {
            const file = pick(candidates);
            const entry = zip.file(file);
            if (!entry)
                continue;
            const html = await entry.async("string");
            const text = htmlToPlainText(html);
            if (looksLikeFrontBackMatter(text)) {
                continue;
            }
            // Split into sentences and filter for reasonable length
            const sentences = text
                .split(/(?<=[.?!])\s+/)
                .map(s => s.trim())
                .filter(s => s.length > 40 && /[A-Za-z]/.test(s));
            if (sentences.length > 0) {
                return pick(sentences);
            }
        }
        return "⚠️ No suitable sentences found (skipped front/back matter & very short sections).";
    }
    catch (err) {
        console.error("Error reading epub:", err);
        return "⚠️ Failed to read epub.";
    }
}
// Raw fallback if no OPF/spine found
async function randomSentenceByRawScan(zip) {
    const files = Object.keys(zip.files)
        .filter(f => /\.(xhtml|html)$/i.test(f))
        .filter(f => !filenameIsNonChapter(f.toLowerCase()));
    if (!files.length)
        return "⚠️ No HTML/XHTML content found in this EPUB.";
    for (let attempts = 0; attempts < Math.min(10, files.length); attempts++) {
        const file = pick(files);
        const entry = zip.file(file);
        if (!entry)
            continue;
        const html = await entry.async("string");
        const text = htmlToPlainText(html);
        if (looksLikeFrontBackMatter(text))
            continue;
        const sentences = text
            .split(/(?<=[.?!])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 40 && /[A-Za-z]/.test(s));
        if (sentences.length)
            return pick(sentences);
    }
    return "⚠️ No suitable sentences found (fallback scan).";
}
function getAllEpubsInDir(dir) {
    let results = [];
    if (!fs.existsSync(dir)) {
        console.warn("Epub dir does not exist:", dir);
        return results;
    }
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(getAllEpubsInDir(fullPath));
        }
        else if (entry.isFile() && entry.name.toLowerCase().endsWith(".epub")) {
            results.push(fullPath);
        }
    }
    return results;
}
