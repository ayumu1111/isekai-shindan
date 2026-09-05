// ==================== 広告設定 ====================
// Google AdSense H5 Games Ads (Ad Placement API) の認証情報。
// ここが null の間は、js/ads.js の疑似視聴演出(playSimulatedAd: 4秒のプログレスバー)に
// フォールバックする。サイトの見た目・動作は一切変わらない。
//
// 有効化に必要なもの（歩夢さん自身で進める必要がある。異世界転生ガチャの
// docs/ads-setup.md と同じ流れ）:
//   1. 独自ドメイン → 本サイトは isekai-tensei-shindan.com 取得・Cloudflare接続済みなので対応済み
//   2. そのドメインで承認されたAdSenseアカウント
//   3. H5 Games Adsへの別枠の申請の承認（審査は保証されない）
//
// 上記が揃ったら、AdSenseの管理画面で発行される "ca-pub-XXXXXXXXXXXXXXXX" 形式の
// クライアントIDをここに書き込むだけで、js/ads.jsが自動的に本物のインタースティシャル
// 広告(adBreak type:'next')を使うようになる。
const ADSENSE_CLIENT_ID = 'ca-pub-8202611626707436';

// true にすると、Googleのテストモード(モック広告、実際の広告リクエストを送らない)で
// 動作を確認できる。本番公開前には必ず false に戻すこと（テストモードのままだと
// 収益が発生しない）。
const ADSENSE_TEST_MODE = false;
