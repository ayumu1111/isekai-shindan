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
let adsbygoogleLoadPromise = null;
function loadAdsbygoogleScript() {
  if (adsbygoogleLoadPromise) return adsbygoogleLoadPromise;
  adsbygoogleLoadPromise = new Promise((resolve, reject) => {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(ADSENSE_CLIENT_ID);
    if (ADSENSE_TEST_MODE) script.setAttribute('data-adbreak-test', 'on');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('adsbygoogle.js load failed'));
    document.head.appendChild(script);
  });
  return adsbygoogleLoadPromise;
}

// Google Ad Placement API のインタースティシャル(adBreak type:'next')を再生する。
// オプトインの確認は挟まず、beforeAd/afterAdの間だけ待つ。広告在庫なし等でadBreak自体が
// 始まらなかった場合はadBreakDoneで即resolveし、読み込み失敗時もcatchで進行を止めない。
function playRealInterstitialAd() {
  return loadAdsbygoogleScript().then(() => new Promise(resolve => {
    window.adBreak({
      type: 'next',
      name: 'result-reveal',
      afterAd: () => resolve(),
      adBreakDone: () => resolve()
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
// 「結果を準備しています」の一瞬のつなぎとして軽く見せておく）。
async function playResultAd() {
  if (hasRealAds()) {
    const overlay = document.getElementById('adOverlay');
    overlay.hidden = false;
    try {
      await playRealInterstitialAd();
    } finally {
      overlay.hidden = true;
    }
    return;
  }
  await playSimulatedAd();
}
