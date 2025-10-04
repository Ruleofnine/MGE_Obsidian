import * as fs from "fs";
import * as path from "path";
import * as JSZip from "jszip";
const P = path.posix;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}


function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function looksLikeFrontBackMatter(text: string): boolean {
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

function filenameIsNonChapter(fnLower: string): boolean {
console.log(fnLower);
  // exclude obvious non-reading files
  return /(nav|toc|ncx|cover|titlepage|title-page|copyright|colophon|acknowledg|dedication|frontmatter|backmatter|index|advert|promo|about)/.test(
    fnLower
  );
}

export async function getRandomSentenceFromEpub(filePath: string): Promise<string> {
  try {
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);

    // --- Find OPF ---
    let opfPath: string | null = null;
    const container = await zip.file("META-INF/container.xml")?.async("string");
    if (container) {
      const m = container.match(/full-path="([^"]+)"/);
      if (m) opfPath = m[1];
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
    const opf = await zip.file(opfPath)!.async("string");

    // --- Parse manifest ---
    const manifest: Record<
      string,
      { href: string; props: string; media: string }
    > = {};
    const itemRe =
      /<item\b[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*media-type="([^"]+)"[^>]*?(?:properties="([^"]+)")?[^>]*\/?>/gi;
    let im: RegExpExecArray | null;
    while ((im = itemRe.exec(opf))) {
      const [, id, href, media, props = ""] = im;
      manifest[id] = {
        href,
        media: media.toLowerCase(),
        props: props.toLowerCase(),
      };
    }

    // --- Parse spine ---
    type SpineRef = { idref: string; props: string; linear: boolean };
    const spineRefs: SpineRef[] = [];
    const itemrefRe =
      /<itemref\b[^>]*idref="([^"]+)"[^>]*?(?:properties="([^"]+)")?[^>]*?(?:linear="([^"]+)")?[^>]*\/?>/gi;
    let sr: RegExpExecArray | null;
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
      .filter(
        item =>
          !item.props.includes("nav") &&
          !item.props.includes("cover-image") &&
          !item.props.includes("page-list")
      )
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
      if (!entry) continue;

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
  } catch (err) {
    console.error("Error reading epub:", err);
    return "⚠️ Failed to read epub.";
  }
}

// Raw fallback if no OPF/spine found
async function randomSentenceByRawScan(zip: JSZip): Promise<string> {
  const files = Object.keys(zip.files)
    .filter(f => /\.(xhtml|html)$/i.test(f))
    .filter(f => !filenameIsNonChapter(f.toLowerCase()));

  if (!files.length) return "⚠️ No HTML/XHTML content found in this EPUB.";

  for (let attempts = 0; attempts < Math.min(10, files.length); attempts++) {
    const file = pick(files);
    const entry = zip.file(file);
    if (!entry) continue;

    const html = await entry.async("string");
    const text = htmlToPlainText(html);
    if (looksLikeFrontBackMatter(text)) continue;

    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 40 && /[A-Za-z]/.test(s));

    if (sentences.length) return pick(sentences);
  }

  return "⚠️ No suitable sentences found (fallback scan).";
}
export function getAllEpubsInDir(dir: string): string[] {
  let results: string[] = [];

  if (!fs.existsSync(dir)) {
    console.warn("Epub dir does not exist:", dir);
    return results;
  }

  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(getAllEpubsInDir(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".epub")) {
      results.push(fullPath);
    }
  }

  return results;
}
