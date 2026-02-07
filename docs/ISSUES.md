# 開発Issue一覧

このファイルはGitHub Issueの一括作成用テンプレートです。

---

## Phase 0: 環境構築

### Issue 0-1: プロジェクト初期化
**Labels:** `phase:0-setup`

```
npm init, TypeScript, Phaser.js, ESLint, Prettier, Jestのセットアップ

## タスク
- [ ] npm init
- [ ] TypeScript設定（tsconfig.json）
- [ ] Phaser.js導入
- [ ] ESLint + Prettier設定
- [ ] Jest設定
- [ ] package.jsonスクリプト整備
```

### Issue 0-2: ディレクトリ構成作成
**Labels:** `phase:0-setup`
**Depends on:** #0-1

```
CLAUDE.mdに記載のディレクトリ構成を作成

## 構成
src/
├── scenes/       # Phaserシーン
├── entities/     # ゲームオブジェクト
├── battle/       # バトルロジック
├── network/      # Socket.io通信
├── types/        # 型定義
├── utils/        # ユーティリティ
└── constants/    # 定数
```

### Issue 0-3: CI/CD設定
**Labels:** `phase:0-setup`
**Depends on:** #0-1

```
GitHub Actionsでlint, test, buildを自動実行

## タスク
- [ ] .github/workflows/ci.yml作成
- [ ] lint job
- [ ] test job
- [ ] build job
```

---

## Phase 1: バトルロジック

### Issue 1-1: 型定義
**Labels:** `phase:1-battle`
**Depends on:** #0-2

```
バトルシステムの型定義を作成

## 型
- Monster（HP, 腕力, 特殊, 素早さ, 丈夫さ, 特殊回数）
- Equipment（武器, リフレクター）
- Command（7種類のコマンド）
- BattleState（バトル状態）
- Distance（近/中/遠）
- Stance（通常/攻勢/守勢）
```

### Issue 1-2: 魂格データ定義
**Labels:** `phase:1-battle`
**Depends on:** #1-1

```
8魂格のパラメータと装備データを定義

## データ
- 8魂格の基礎パラメータ（PROJECT.md参照）
- 装備タイプA/Bの倍率
- 能力UP値（1段階あたり）
```

### Issue 1-3: ダメージ計算
**Labels:** `phase:1-battle`
**Depends on:** #1-1

```
ダメージ計算ロジックを実装

## 計算式
- 武器攻撃: max(腕力 × 武器倍率 - 丈夫さ, 1)
- 特殊攻撃: 特殊 × 1.0（回数超過時は×0.5）
- リフレクター反射: 相手の特殊ダメージ × 反射率
- スタンス倍率の適用
```

### Issue 1-4: 回避判定
**Labels:** `phase:1-battle`
**Depends on:** #1-1

```
回避率計算を実装

## 仕様
- 計算式: min(素早さ × 0.5, 25)%
- 武器攻撃・特殊攻撃どちらも回避可能
- 近距離で武器vs武器は回避不可（必中相打ち）
```

### Issue 1-5: 距離システム
**Labels:** `phase:1-battle`
**Depends on:** #1-1

```
3段階距離システムを実装

## 仕様
- 近距離 / 中距離 / 遠距離
- 前進で1段階縮める、後退で1段階広げる
- 双方同方向移動で2段階移動
- 距離マトリクス表に従った処理
```

### Issue 1-6: スタンスシステム
**Labels:** `phase:1-battle`
**Depends on:** #1-3

```
スタンス切替を実装

## 仕様
- 通常: 攻撃×1.0 / 防御×1.0
- 攻勢: 攻撃×1.3 / 防御×0.7
- 守勢: 攻撃×0.7 / 防御×1.3
- どのスタンスからでも1回で切替可能
```

### Issue 1-7: コマンド優先順位
**Labels:** `phase:1-battle`
**Depends on:** #1-3, #1-5

```
じゃんけん構造の優先順位を実装

## 仕様
- 武器攻撃 > リフレクター > 特殊攻撃
- 近距離で武器vs特殊 → 武器が先に発生し特殊を潰す
- 武器攻撃はリフレクターで防げない（貫通）
- リフレクターは特殊攻撃を無効化/反射
```

### Issue 1-8: ターン処理
**Labels:** `phase:1-battle`
**Depends on:** #1-3, #1-4, #1-5, #1-6, #1-7

```
TCB（ツインコマンドバトル）のターン処理を実装

## 仕様
- 双方が2コマンドを選択
- 1stコマンドを同時処理
- 2ndコマンドを同時処理
- 各処理で距離・HP・スタンス等を更新
```

### Issue 1-9: 勝敗判定
**Labels:** `phase:1-battle`
**Depends on:** #1-8

```
勝敗判定ロジックを実装

## 条件
- 相手のHP0 → 勝利
- 制限時間（2分）終了時、HP多い方 → 勝利
- 制限時間終了時、HP同値 → ドロー
- ギブアップ → 敗北
```

---

## Phase 2: CPU AI

### Issue 2-1: AI基盤
**Labels:** `phase:2-ai`
**Depends on:** #1-8

```
AIレベル別の行動選択インターフェースを実装

## 設計
- AILevel enum (Lv1-Lv5)
- selectCommands(state, level): [Command, Command]
- 種族別傾向の重み付け構造
```

### Issue 2-2: Lv1 AI（ランダム）
**Labels:** `phase:2-ai`
**Depends on:** #2-1

```
Lv1: ほぼランダム行動

## 仕様
- 7コマンドから均等な確率で選択
- 重み付けなし
```

### Issue 2-3: Lv2 AI（距離ベース）
**Labels:** `phase:2-ai`
**Depends on:** #2-1

```
Lv2: 距離に応じた基本行動

## 仕様
- 近距離 → 武器攻撃を選びやすい
- 遠距離 → 特殊攻撃or前進を選びやすい
- 中距離 → バランス
```

### Issue 2-4: Lv3 AI（状況考慮）
**Labels:** `phase:2-ai`
**Depends on:** #2-1

```
Lv3: Lv2 + 状況を考慮

## 仕様
- 相手のHP残量を見て攻撃的/守備的に
- 相手のスタンスを見て対応
- リフレクター残数を見て特殊攻撃の頻度調整
```

### Issue 2-5: Lv4 AI（パターン読み）
**Labels:** `phase:2-ai`
**Depends on:** #2-1

```
Lv4: Lv3 + パターン読み

## 仕様
- プレイヤーの過去N手を記録
- 傾向を分析して対応コマンドを選択
```

### Issue 2-6: Lv5 AI（最適行動）
**Labels:** `phase:2-ai`
**Depends on:** #2-1

```
Lv5: 常に最適行動を選択

## 仕様
- 全パターンを評価して最適解を選択
- ランダム要素なし
- 自由対戦「最強」で使用
```

### Issue 2-7: 種族別傾向
**Labels:** `phase:2-ai`
**Depends on:** #2-2, #2-3, #2-4, #2-5, #2-6

```
8種族のAI傾向を実装

## 傾向（PROJECT.md参照）
- ゴーレム: 前進＋武器攻撃重視
- ウィスプ: 後退＋特殊攻撃重視
- etc.
```

---

## Phase 3: UI/シーン

### Issue 3-1: Phaserセットアップ
**Labels:** `phase:3-ui`
**Depends on:** #0-2

```
Phaserのゲームコンフィグとシーン管理を実装

## タスク
- [ ] GameConfig設定
- [ ] SceneManager
- [ ] アセットローダー基盤
```

### Issue 3-2: タイトル画面
**Labels:** `phase:3-ui`
**Depends on:** #3-1

```
タイトル画面を実装

## 要素
- ゲームタイトル
- 「挑戦モード」ボタン
- 「自由対戦（CPU）」ボタン
- 「自由対戦（ローカル）」ボタン
- 「設定」ボタン
```

### Issue 3-3: キャラ選択画面
**Labels:** `phase:3-ui`
**Depends on:** #3-1

```
キャラ選択画面を実装

## 要素
- 8魂格の選択グリッド
- 未解放キャラのロック表示
- パラメータ表示
- 決定/戻るボタン
```

### Issue 3-4: バトル画面（基盤）
**Labels:** `phase:3-ui`
**Depends on:** #3-1

```
バトル画面の基盤を実装

## 要素
- HPバー（自分/相手）
- キャラ表示エリア
- 距離表示
- 残り時間表示
- スタンス表示
```

### Issue 3-5: コマンド選択UI
**Labels:** `phase:3-ui`
**Depends on:** #3-4

```
コマンド選択UIを実装

## 要素
- 7コマンドボタン
- 1st/2nd選択表示
- 選択キャンセル
- 決定ボタン
- スタンスに応じたボタン表示切替
```

### Issue 3-6: バトル演出
**Labels:** `phase:3-ui`
**Depends on:** #3-4

```
バトル演出を実装

## 演出
- 攻撃エフェクト（武器/特殊）
- リフレクター発動エフェクト
- ダメージ数値表示
- 距離移動アニメーション
- 回避エフェクト
```

### Issue 3-7: リザルト画面
**Labels:** `phase:3-ui`
**Depends on:** #3-1

```
リザルト画面を実装

## 要素
- 勝敗表示
- 残りHP表示
- 報酬表示（挑戦モード時）
- 「次へ」「リトライ」「タイトルへ」ボタン
```

### Issue 3-8: 設定画面
**Labels:** `phase:3-ui`
**Depends on:** #3-1

```
設定画面を実装

## 要素
- BGM音量スライダー
- SE音量スライダー
- 演出速度（通常/高速）
```

---

## Phase 4: ゲームモード

### Issue 4-1: 自由対戦（CPU）
**Labels:** `phase:4-mode`
**Depends on:** #1-9, #2-7, #3-7

```
CPU対戦フローを実装

## フロー
1. キャラ選択（自分）
2. キャラ選択（相手）or ランダム
3. 難易度選択（弱い/普通/強い/最強）
4. バトル
5. リザルト
```

### Issue 4-2: 挑戦モード基盤
**Labels:** `phase:4-mode`
**Depends on:** #4-1

```
8ステージの進行管理を実装

## 仕様
- ステージ順序（PROJECT.md参照）
- クリア状態管理
- 再挑戦機能
```

### Issue 4-3: チュートリアル
**Labels:** `phase:4-mode`
**Depends on:** #4-2

```
ステージ1のチュートリアルを実装

## 仕様
- ターン1〜5: 固定コマンド
- ポップアップで操作説明
- ターン6以降: 自由戦闘
（詳細はPROJECT.md参照）
```

### Issue 4-4: キャラ解放
**Labels:** `phase:4-mode`
**Depends on:** #4-2

```
ステージクリアでキャラ解放を実装

## 仕様
- ステージN クリア → そのステージの敵キャラ解放
- 解放状態の永続化
```

### Issue 4-5: 能力UP
**Labels:** `phase:4-mode`
**Depends on:** #4-2

```
ステージクリアで能力UPを実装

## 仕様
- クリアごとに全キャラの能力UP（最大7段階）
- 種族別の上昇量（PROJECT.md参照）
- 敵も同等に強化
```

### Issue 4-6: 進捗保存
**Labels:** `phase:4-mode`
**Depends on:** #4-2

```
LocalStorageで進捗を永続化

## 保存項目
- クリア済みステージ
- 解放済みキャラ
- 能力UP段階
- 設定値
```

---

## Phase 5: ローカル対戦

### Issue 5-1: Socket.ioサーバー
**Labels:** `phase:5-network`
**Depends on:** #0-1

```
バックエンドサーバーを構築

## 構成
- Node.js + Socket.io
- 部屋管理
- 接続管理
```

### Issue 5-2: 部屋作成/参加
**Labels:** `phase:5-network`
**Depends on:** #5-1

```
マッチングUIを実装

## フロー
- 部屋作成 → URL生成
- URLシェア
- 相手がアクセスして入室
- パスワード（オプション）
```

### Issue 5-3: コマンド同期
**Labels:** `phase:5-network`
**Depends on:** #5-1

```
コマンドの送受信を実装

## 仕様
- 双方がコマンド選択完了まで待機
- 同時に結果を受信
- コマンドは相手に見えない
```

### Issue 5-4: バトル同期
**Labels:** `phase:5-network`
**Depends on:** #5-3, #1-8

```
ターン進行の同期を実装

## 仕様
- サーバーでターン処理
- 結果を両クライアントに配信
- 状態の整合性確保
```

### Issue 5-5: 切断処理
**Labels:** `phase:5-network`
**Depends on:** #5-4

```
切断時の処理を実装

## 仕様
- 切断検知
- 相手にギブアップ扱いで勝利通知
- 部屋のクリーンアップ
```

---

## Phase 6: ポリッシュ

### Issue 6-1: レスポンシブ対応
**Labels:** `phase:6-polish`
**Depends on:** #3-1〜#3-8

```
PC/モバイル両対応を実装

## 対応
- 画面サイズ検知
- レイアウト調整
- タッチ/マウス両対応
```

### Issue 6-2: SE/BGM
**Labels:** `phase:6-polish`
**Depends on:** #3-6

```
音声を実装

## 音声
- タイトルBGM
- バトルBGM
- 攻撃SE
- 選択SE
- 勝利/敗北SE
```

### Issue 6-3: プレースホルダー画像
**Labels:** `phase:6-polish`
**Depends on:** #3-4〜#3-6

```
仮画像でプレイ可能にする

## 画像
- 8キャラのプレースホルダー
- UIパーツ
- エフェクト素材
```

### Issue 6-4: デプロイ
**Labels:** `phase:6-polish`

```
本番環境へデプロイ

## 構成
- フロント: Vercel
- バック: Render
- ドメイン設定（任意）
```

---

## ラベル定義

| ラベル | 色 | 説明 |
|--------|-----|------|
| phase:0-setup | #0E8A16 | 環境構築 |
| phase:1-battle | #1D76DB | バトルロジック |
| phase:2-ai | #D93F0B | CPU AI |
| phase:3-ui | #FBCA04 | UI/シーン |
| phase:4-mode | #5319E7 | ゲームモード |
| phase:5-network | #006B75 | ローカル対戦 |
| phase:6-polish | #C2E0C6 | ポリッシュ |
