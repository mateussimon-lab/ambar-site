// Monta a pasta "dist" que a Netlify publica.
//
// - Copia as páginas, o conteúdo, o painel (/admin) e as imagens.
// - Reduz fotos muito pesadas (ex.: foto de celular de 5 MB) SÓ na cópia publicada.
//   Os arquivos originais do repositório nunca são alterados.
// - Se qualquer otimização falhar, copia o arquivo original: o site nunca deixa de publicar por causa disso.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const FOLDERS = ["assets", "content", "admin"];
const PHOTO_MAX_SIDE = 2400; // lado maior, em pixels, das fotos publicadas
const LOGO_MAX_WIDTH = 900; // logos aparecem pequenos (~190px), 900px já é nítido até em tela retina
const ONLY_IF_BIGGER_THAN = 300 * 1024; // arquivos menores que 300 KB são copiados como estão

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("[build] 'sharp' não está instalado: as imagens serão copiadas sem otimização.");
}

const stats = { copied: 0, optimized: 0, before: 0, after: 0 };

async function optimizeImage(from, to, size) {
  const name = path.basename(from).toLowerCase();
  const isLogo = name.startsWith("logo");
  const isJpeg = /\.jpe?g$/.test(name);
  const isPng = /\.png$/.test(name);
  if (!sharp || !(isJpeg || isPng) || size <= ONLY_IF_BIGGER_THAN) return false;

  try {
    let image = sharp(from).rotate(); // respeita a orientação da câmera
    image = isLogo
      ? image.resize({ width: LOGO_MAX_WIDTH, withoutEnlargement: true })
      : image.resize({ width: PHOTO_MAX_SIDE, height: PHOTO_MAX_SIDE, fit: "inside", withoutEnlargement: true });
    image = isJpeg
      ? image.jpeg({ quality: 82, mozjpeg: true })
      : image.png({ compressionLevel: 9, adaptiveFiltering: true });

    const buffer = await image.toBuffer();
    if (buffer.length >= size) return false; // não ficou menor: mantém o original
    await fs.writeFile(to, buffer);
    stats.optimized += 1;
    stats.before += size;
    stats.after += buffer.length;
    return true;
  } catch (error) {
    console.warn(`[build] não foi possível otimizar ${path.relative(root, from)}: ${error.message}`);
    return false;
  }
}

async function copyTree(fromDir, toDir) {
  await fs.mkdir(toDir, { recursive: true });
  for (const entry of await fs.readdir(fromDir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue; // .gitkeep, .DS_Store etc.
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to);
    } else {
      const { size } = await fs.stat(from);
      if (!(await optimizeImage(from, to, size))) {
        await fs.copyFile(from, to);
      }
      stats.copied += 1;
    }
  }
}

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

for (const entry of await fs.readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".html")) {
    await fs.copyFile(path.join(root, entry.name), path.join(dist, entry.name));
    stats.copied += 1;
  }
}
// Arquivos soltos na raiz que o navegador e o Google procuram.
for (const name of ["robots.txt", "favicon.ico"]) {
  try {
    await fs.copyFile(path.join(root, name), path.join(dist, name));
    stats.copied += 1;
  } catch {
    console.warn(`[build] ${name} não encontrado na raiz: ignorado.`);
  }
}

// sitemap.xml é montado aqui a partir de content/projetos.json,
// então projetos novos criados pelo painel entram sozinhos.
try {
  const SITE = "https://ambararquitetura.com.br";
  const data = JSON.parse(await fs.readFile(path.join(root, "content", "projetos.json"), "utf8"));
  const slugify = (text) =>
    String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const ids = (data.projetos || []).map((item) => item.id || slugify(item.title)).filter(Boolean);
  const pages = ["/", "/somos.html", "/projetos.html", "/planejamento.html", "/gestao.html", "/contato.html"];
  const urls = [...pages, ...[...new Set(ids)].map((id) => `/projeto.html?id=${encodeURIComponent(id)}`)];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${SITE}${u.replace(/&/g, "&amp;")}</loc></url>`).join("\n") +
    "\n</urlset>\n";
  await fs.writeFile(path.join(dist, "sitemap.xml"), xml);
  stats.copied += 1;
} catch (error) {
  console.warn(`[build] não foi possível montar o sitemap.xml: ${error.message}`);
}

for (const folder of FOLDERS) {
  const source = path.join(root, folder);
  try {
    await fs.access(source);
  } catch {
    continue;
  }
  await copyTree(source, path.join(dist, folder));
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
console.log(`[build] ${stats.copied} arquivos em "dist".`);
if (stats.optimized) {
  console.log(`[build] ${stats.optimized} imagens reduzidas: ${mb(stats.before)} MB -> ${mb(stats.after)} MB.`);
}
