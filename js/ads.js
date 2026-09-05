// ==================== 結果表示前の広告 ====================
// 29問すべてに回答した直後、結果を表示する前に短い広告を挟む。ガチャ本体の
// リワード広告(opt-in、押した人だけボーナス)とは異なり、こちらは全員が通る
// 導線なので、AdBreakのtypeは 'reward' ではなく 'next'（自然な区切りでの
// インタースティシャル）を使う。視聴の成否に関わらず必ず結果画面へ進む
// （広告在庫なし・読み込み失敗で診断がブロックされることは無い）。
//
// js/ad-config.js の ADSENSE_CLIENT_ID が未設定(null)の間は、4秒のプログレスバーで
// 「結果を準備しています」を表現する疑似演出にフォールバックする。IDが発行されたら
// 自動的に本物の広告に切り替わり、呼び出し側(main.js)のコードは変更不要。

const AD_VIEW_DURATION_MS = 4000;

function hasRealAds() {
  return typeof ADSENSE_CLIENT_ID === 'string' && ADSENSE_CLIENT_ID.length > 0;
}

// adsbygoogle.js自体は一度だけ読み込む。ADSENSE_CLIENT_IDが無い間はこの関数は
// 呼ばれないため、広告アカウント未設定の状態ではネットワークリクエストが一切発生しない。
// index.html <head> にサイト確認/Auto ads用の同じスクリプトタグを静的に置いてあるため、
// テストモードでない通常時はそれをそのまま使い、二重読み込みしない。
let adsbygoogleLoadPromise = null;
function loadAdsbygoogleScript() {
  if (adsbygoogleLoadPromise) return adsbygoogleLoadPromise;
  const src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ADSENSE_CLIENT_ID);
  const alreadyInHead = !ADSENSE_TEST_MODE && document.querySelector(`script[src="${src}"]`);

  adsbygoogleLoadPromise = new Promise((resolve, reject) => {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    if (alreadyInHead) { resolve(); return; }

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = src;
    if (ADSENSE_TEST_MODE) script.setAttribute('data-adbreak-test', 'on');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('adsbygoogle.js load failed'));
    document.head.appendChild(script);
  });
  return adsbygoogleLoadPromise;
}

// Google Ad Placement API のインタースティシャル(adBreak type:'next')を再生する。
// オプトインの確認は挟まず、afterAdまで待つ。広告在庫なし等でadBreak自体が
// 始まらなかった場合はadBreakDoneで即resolveする想定だが、実機検証で
// 「未検証ドメイン(localhost等)ではafterAdもadBreakDoneも一切呼ばれず
// Promiseが永久に解決しない」ケースを確認した。診断がそれで詰まっては
// 本末転倒なので、AD_RESOLVE_TIMEOUT_MS経過しても応答が無ければ強制的に
// 進める安全策を必ず入れる。読み込み失敗時もcatchで進行を止めない。
const AD_RESOLVE_TIMEOUT_MS = 10000;
function playRealInterstitialAd() {
  return loadAdsbygoogleScript().then(() => new Promise(resolve => {
    let settled = false;
    const finish = () => { if (!settled) { settled = true; resolve(); } };
    const timeoutId = setTimeout(finish, AD_RESOLVE_TIMEOUT_MS);
    window.adBreak({
      type: 'next',
      name: 'result-reveal',
      afterAd: () => { clearTimeout(timeoutId); finish(); },
      adBreakDone: () => { clearTimeout(timeoutId); finish(); }
    });
  })).catch(() => undefined);
}

// 疑似演出版。プログレスバー+秒数カウントダウンで4秒待たせる。
// 実広告と違って視聴完了は保証されないものではなく、常に最後まで進む前提の表現。
function playSimulatedAd() {
  return new Promise(resolve => {
    const overlay = document.getElementById('adOverlay');
    const fill = document.getElementById('adProgressFill');
    const secondsEl = document.getElementById('adSeconds');
    fill.style.transition = 'none';
    fill.style.width = '0%';
    overlay.hidden = false;
    void overlay.offsetWidth; // 直前のhidden解除を確実に反映させてからtransitionを開始する

    let remainingSec = Math.ceil(AD_VIEW_DURATION_MS / 1000);
    secondsEl.textContent = remainingSec;
    const tick = setInterval(() => {
      remainingSec = Math.max(0, remainingSec - 1);
      secondsEl.textContent = remainingSec;
    }, 1000);

    requestAnimationFrame(() => {
      fill.style.transition = `width ${AD_VIEW_DURATION_MS}ms linear`;
      fill.style.width = '100%';
    });
    setTimeout(() => {
      clearInterval(tick);
      overlay.hidden = true;
      resolve();
    }, AD_VIEW_DURATION_MS);
  });
}

// main.jsから呼ぶ入口。実広告が使える場合だけオーバーレイのUIを出しつつ本物のadBreakを
// 呼ぶ（Googleの広告プレイヤー自体が全画面表示になるため、下敷きのオーバーレイは
// 「結果を準備しています」の一瞬のつなぎとして軽く見せておく）。実広告は所要時間が
// 読めないため、疑似演出のような正確なカウントダウンにはせず、じわじわ進んで止まる
// 「読み込み中」の表現にする（止まって見えても壊れて見えないようにするため）。
async function playResultAd() {
  if (hasRealAds()) {
    const overlay = document.getElementById('adOverlay');
    const fill = document.getElementById('adProgressFill');
    const note = document.getElementById('adOverlayNote');
    note.textContent = '広告を読み込んでいます…';
    fill.style.transition = 'none';
    fill.style.width = '0%';
    overlay.hidden = false;
    void overlay.offsetWidth;
    requestAnimationFrame(() => {
      fill.style.transition = `width ${AD_RESOLVE_TIMEOUT_MS * 0.9}ms ease-out`;
      fill.style.width = '85%';
    });
    try {
      await playRealInterstitialAd();
    } finally {
      overlay.hidden = true;
    }
    return;
  }
  await playSimulatedAd();
}
