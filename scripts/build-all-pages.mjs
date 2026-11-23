import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TRACKS = [
  {
    key: 'de-1',
    dir: 'de-1-so-tay-chi-doan',
    title: 'Đề 1: Sổ Tay Chi Đoàn Số',
    desc: 'Quản lý đoàn viên, chấm công QR động, xuất báo cáo Thành đoàn 1-click & nhắc lịch tự động.',
    badge: 'Chi đoàn cơ sở',
    accent: '#0284c7'
  },
  {
    key: 'de-2',
    dir: 'de-2-tai-mat-cong-dan',
    title: 'Đề 2: Tai Mắt Công Dân Đồng Nai',
    desc: 'Phản ánh hạ tầng kèm ảnh watermark + GPS, điều phối 95 xã/phường, bản đồ Leaflet & xếp hạng SLA.',
    badge: '95 xã/phường',
    accent: '#0f172a'
  },
  {
    key: 'de-3',
    dir: 'de-3-ocop-len-san',
    title: 'Đề 3: OCOP Đồng Nai Lên Sàn',
    desc: 'Kết nối 150+ sản phẩm OCOP 3–4 sao lên sàn TMĐT, Video Studio Template & mạng lưới Đoàn viên Affiliate.',
    badge: 'OCOP 3–4 sao',
    accent: '#059669'
  },
  {
    key: 'de-4',
    dir: 'de-4-chong-lua-101',
    title: 'Đề 4: Chống Lừa 101',
    desc: 'Mini-game / Chatbot mô phỏng tình huống lừa đảo trực tuyến & cấp chứng chỉ Công dân số an toàn.',
    badge: 'HS-SV 16–22t',
    accent: '#e11d48'
  }
];

const rawBase = process.env.VITE_BASE_PATH || '/hackathon/';
let basePrefix = rawBase.startsWith('/') ? rawBase : `/${rawBase}`;
if (!basePrefix.endsWith('/')) basePrefix += '/';

const outRoot = resolve('dist-pages');
rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

const builtMeta = [];

for (const track of TRACKS) {
  const trackDir = resolve(track.dir);
  const trackBase = `${basePrefix}${track.key}/`;
  console.log(`[hub] Building ${track.dir} with VITE_BASE_PATH=${trackBase}`);

  execSync('npx vite build', {
    cwd: trackDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_BASE_PATH: trackBase
    }
  });

  const srcDist = resolve(trackDir, 'dist');
  const destDist = resolve(outRoot, track.key);
  if (!existsSync(srcDist)) {
    throw new Error(`Missing dist output for ${track.dir}`);
  }
  cpSync(srcDist, destDist, { recursive: true });
  builtMeta.push({
    ...track,
    hasPitchDeck: existsSync(resolve(destDist, 'pitch-deck.html'))
  });
}

const cardsHtml = builtMeta
  .map(
    (t) => `
    <article class="card">
      <div class="badge" style="background:${t.accent}15;color:${t.accent};border:1px solid ${t.accent}40;">${t.badge}</div>
      <h2>${t.title}</h2>
      <p>${t.desc}</p>
      <div class="actions">
        <a class="btn primary" style="background:${t.accent};" href="./${t.key}/">Mở Web App</a>
        ${
          t.hasPitchDeck
            ? `<a class="btn secondary" href="./${t.key}/pitch-deck.html" target="_blank" rel="noreferrer">Pitch Deck 10 Slide</a>`
            : `<span class="btn secondary muted">Starter cấu trúc sẵn sàng</span>`
        }
      </div>
    </article>`
  )
  .join('');

const hubHtml = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đồng Nai Hackathon — 4 Cấu Trúc Độc Lập</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; }
    header { background: #0f172a; color: #fff; padding: 36px 20px; text-align: center; }
    header h1 { margin: 0 0 8px; font-size: clamp(22px, 4vw, 32px); }
    header p { margin: 0 auto; max-width: 680px; color: #cbd5e1; font-size: 15px; line-height: 1.5; }
    main { max-width: 1100px; margin: 28px auto; padding: 0 16px 48px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; box-shadow: 0 1px 3px rgba(15,23,42,0.05); }
    .badge { display: inline-block; align-self: flex-start; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    h2 { margin: 0; font-size: 18px; line-height: 1.35; }
    p { margin: 0; font-size: 14px; color: #475569; line-height: 1.55; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 6px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 10px 14px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: 700; }
    .btn.primary { color: #fff; }
    .btn.secondary { border: 1px solid #cbd5e1; color: #0f172a; background: #f8fafc; }
    .btn.muted { color: #475569; font-weight: 600; }
    footer { text-align: center; padding: 20px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; background: #fff; }
  </style>
</head>
<body>
  <header>
    <h1>Portal 4 Đề Tài Hackathon Đồng Nai</h1>
    <p>4 thư mục độc lập sẵn sàng phát triển, đóng gói và triển khai lên internet.</p>
  </header>
  <main>${cardsHtml}</main>
  <footer>BASE_PATH: ${basePrefix} • 4 Đề Độc Lập (Đề 1 · Đề 2 · Đề 3 · Đề 4)</footer>
</body>
</html>`;

const notFoundHtml = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chuyển hướng — Đồng Nai Hackathon</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 40px auto; max-width: 600px; padding: 0 16px; color: #0f172a; }
    a { display: inline-block; margin: 6px 8px 6px 0; padding: 10px 14px; border-radius: 8px; background: #0284c7; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
  <script>
    (function () {
      var basePrefix = ${JSON.stringify(basePrefix)};
      var allowedTracks = ['de-1', 'de-2', 'de-3', 'de-4'];
      var path = window.location.pathname || '';
      for (var i = 0; i < allowedTracks.length; i++) {
        var prefix = basePrefix + allowedTracks[i];
        if (path === prefix || path.indexOf(prefix + '/') === 0) {
          window.location.replace(prefix + '/');
          return;
        }
      }
    })();
  </script>
</head>
<body>
  <h1>Không tìm thấy đường dẫn</h1>
  <p>Chọn một trong 4 ứng dụng độc lập dưới đây:</p>
  <div>
    <a href="${basePrefix}">Trang chủ Hub</a>
    <a href="${basePrefix}de-1/">Đề 1: Sổ Tay Chi Đoàn</a>
    <a href="${basePrefix}de-2/">Đề 2: Tai Mắt Công Dân</a>
    <a href="${basePrefix}de-3/">Đề 3: OCOP Lên Sàn</a>
    <a href="${basePrefix}de-4/">Đề 4: Chống Lừa 101</a>
  </div>
</body>
</html>`;

writeFileSync(resolve(outRoot, 'index.html'), hubHtml, 'utf8');
writeFileSync(resolve(outRoot, '404.html'), notFoundHtml, 'utf8');
console.log(`[hub] Built dist-pages/ successfully with basePrefix=${basePrefix}`);
