// ==================== シェア用画像カード生成 ====================
// 結果ページの情報から1200x630のPNGをCanvasで組み立てる。サーバー不要でクライアント内完結する。
const ShareCard = (() => {
  const W = 1200, H = 630;

  async function ensureFontsReady() {
    await Promise.all([
      document.fonts.load('800 46px "Shippori Mincho"'),
      document.fonts.load('800 44px "Shippori Mincho"'),
      document.fonts.load('24px "Zen Kaku Gothic New"'),
      document.fonts.load('20px "Zen Kaku Gothic New"'),
      document.fonts.load('22px "Zen Kaku Gothic New"')
    ]);
    if (document.fonts.ready) await document.fonts.ready;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // 「職業名『固有名』」パターンを分割（result.jsのcharNameHtmlと同じ規則）
  function splitName(fullName) {
    const m = fullName.match(/^(.+?)「(.+)」$/);
    if (m) return { job: m[1], proper: `「${m[2]}」` };
    return { job: '', proper: `「${fullName}」` };
  }

  // 日本語は単語区切りがないため文字単位で折り返す
  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let line = '';
    for (const ch of text) {
      const test = line + ch;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  async function build({ name, catchphrase, imageKey }) {
    await ensureFontsReady();
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1B1D3E');
    bg.addColorStop(1, '#0D0E1E');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(212,163,78,0.5)';
    ctx.fillRect(40, 40, W - 80, 2);

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#9691B8';
    ctx.font = '22px "Zen Kaku Gothic New"';
    ctx.fillText('異世界転生後の職業診断', 40, 82);

    try {
      const img = await loadImage(`images/characters/${imageKey}.webp`);
      const boxW = 460, boxH = H - 40;
      const scale = Math.min(boxW / img.width, boxH / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      const dx = 40 + (boxW - dw) / 2, dy = H - dh;
      ctx.drawImage(img, dx, dy, dw, dh);
    } catch (e) { /* 画像取得に失敗しても文字だけで成立させる */ }

    const textX = 540;

    ctx.fillStyle = '#9691B8';
    ctx.font = '24px "Zen Kaku Gothic New"';
    ctx.fillText('あなたの転生キャラは', textX, 150);

    const { job, proper } = splitName(name);
    if (job) {
      ctx.fillStyle = '#9691B8';
      ctx.font = '22px "Zen Kaku Gothic New"';
      ctx.fillText(job, textX, 185);
    }
    const nameGrad = ctx.createLinearGradient(textX, 0, textX + 500, 0);
    nameGrad.addColorStop(0, '#E9C87C');
    nameGrad.addColorStop(0.6, '#D4A34E');
    nameGrad.addColorStop(1, '#B9863A');
    ctx.fillStyle = nameGrad;
    ctx.font = '800 46px "Shippori Mincho"';
    ctx.fillText(proper, textX, job ? 240 : 210);

    ctx.fillStyle = '#9691B8';
    ctx.font = '20px "Zen Kaku Gothic New"';
    ctx.fillText('あなたの性格を一言で表すと', textX, 320);

    const catchGrad = ctx.createLinearGradient(textX, 0, textX + 560, 0);
    catchGrad.addColorStop(0, '#ffffff');
    catchGrad.addColorStop(0.55, '#E9C87C');
    catchGrad.addColorStop(1, '#D4A34E');
    ctx.fillStyle = catchGrad;
    ctx.font = '800 44px "Shippori Mincho"';
    const catchLines = wrapText(ctx, catchphrase, W - textX - 60);
    catchLines.forEach((line, i) => ctx.fillText(line, textX, 375 + i * 54));

    ctx.fillStyle = '#6f6493';
    ctx.font = '20px "Zen Kaku Gothic New"';
    ctx.fillText(location.hostname || 'isekai-tensei-shindan.com', textX, H - 60);

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  return { build };
})();
