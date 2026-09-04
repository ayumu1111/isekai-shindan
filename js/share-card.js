// ==================== シェア用画像カード生成 ====================
// 結果ページの情報から1200x630のPNGをCanvasで組み立てる。サーバー不要でクライアント内完結する。
const ShareCard = (() => {
  const W = 1200, H = 630;
  const BRAND = '異世界転生診断';
  const FACTOR_LABEL = { openness: '開放', conscientiousness: '誠実', extraversion: '外向', agreeableness: '調和', sensitivity: '繊細' };
  const FACTOR_COLOR = { openness: '#9B7EDE', conscientiousness: '#E0A93A', extraversion: '#E1735C', agreeableness: '#4FB3A0', sensitivity: '#D66FA0' };

  async function ensureFontsReady() {
    await Promise.all([
      document.fonts.load('800 46px "Shippori Mincho"'),
      document.fonts.load('800 44px "Shippori Mincho"'),
      document.fonts.load('700 20px "Zen Kaku Gothic New"'),
      document.fonts.load('700 22px "Zen Kaku Gothic New"'),
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

  function drawDiamond(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
  }

  // 因子ランクを1行(開放A 誠実S 外向B ...)で描画し、末尾のx座標を返す
  function drawFactorRow(ctx, x, y, scores, rankTable) {
    let cx = x;
    for (const f of FACTORS) {
      const rank = rankFor(scores[f], rankTable);
      ctx.font = '20px "Zen Kaku Gothic New"';
      ctx.fillStyle = '#9691B8';
      ctx.fillText(FACTOR_LABEL[f], cx, y);
      cx += ctx.measureText(FACTOR_LABEL[f]).width + 4;

      ctx.font = '700 22px "Zen Kaku Gothic New"';
      ctx.fillStyle = FACTOR_COLOR[f];
      ctx.fillText(rank, cx, y);
      cx += ctx.measureText(rank).width + 28;
    }
    return cx;
  }

  async function build({ name, catchphrase, imageKey, scores, rankTable }) {
    await ensureFontsReady();
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';

    // 背景
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1B1D3E');
    bg.addColorStop(1, '#0D0E1E');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 雰囲気付けの淡いグロー(装飾のみ)
    const glow1 = ctx.createRadialGradient(1000, 80, 10, 1000, 80, 380);
    glow1.addColorStop(0, 'rgba(155,126,222,0.20)');
    glow1.addColorStop(1, 'rgba(155,126,222,0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    // 上部の区切り線＋中央の菱形飾り
    ctx.fillStyle = 'rgba(212,163,78,0.5)';
    ctx.fillRect(40, 40, W - 80, 2);
    drawDiamond(ctx, W / 2, 41, 6, '#0D0E1E');
    drawDiamond(ctx, W / 2, 41, 4, '#E9C87C');

    // ブランド名（キャラ立ち絵と重ならないよう、立ち絵側の高さ上限を separately に確保する）
    ctx.fillStyle = '#9691B8';
    ctx.font = '700 22px "Zen Kaku Gothic New"';
    ctx.fillText(BRAND, 40, 92);

    // キャラ立ち絵（後ろに柔らかいグローを敷いて寂しさを和らげる。上端はブランド名の下まで）
    const charTopLimit = 128;
    try {
      const img = await loadImage(`images/characters/${imageKey}.webp`);
      const boxW = 460, boxH = H - charTopLimit;
      const scale = Math.min(boxW / img.width, boxH / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      const dx = 40 + (boxW - dw) / 2, dy = H - dh;

      const glow2 = ctx.createRadialGradient(dx + dw / 2, dy + dh * 0.4, 10, dx + dw / 2, dy + dh * 0.4, dw * 0.75);
      glow2.addColorStop(0, 'rgba(212,163,78,0.22)');
      glow2.addColorStop(1, 'rgba(212,163,78,0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, charTopLimit - 20, 520, H - charTopLimit + 20);

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
    const catchStartY = 375, catchLineH = 54;
    catchLines.forEach((line, i) => ctx.fillText(line, textX, catchStartY + i * catchLineH));

    // 因子ランクの行（要素を足りなく見せないための追加情報。特殊キャラでも本人スコアは常に存在する）
    const afterCatchY = catchStartY + (catchLines.length - 1) * catchLineH;
    const dividerY = afterCatchY + 46;
    const factorY = dividerY + 40;
    if (scores && rankTable) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(textX, dividerY, W - textX - 40, 1);
      drawFactorRow(ctx, textX, factorY, scores, rankTable);
    }

    // フッター: 診断への誘導文＋URL
    const ctaY = factorY + 46;
    ctx.fillStyle = '#c9bdf2';
    ctx.font = '700 20px "Zen Kaku Gothic New"';
    ctx.fillText('あなたも診断してみませんか？', textX, ctaY);

    ctx.fillStyle = '#E9C87C';
    ctx.font = '700 24px "Zen Kaku Gothic New"';
    ctx.fillText(location.hostname || 'isekai-tensei-shindan.com', textX, ctaY + 38);

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  return { build };
})();
