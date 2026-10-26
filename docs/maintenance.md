# Maintenance Notes

小さな機能追加や保守のときに、コードを全部読み直さなくて済むようにするためのメモです。

## 開発コマンド

```bash
npm run dev
npm run test
npm run lint
npm run build
```

## 主要ファイル

- `src/App.jsx`
  - 画像配列の単一ソース。
  - `updateImages` で配列更新と Blob URL 解放をまとめて扱う。
  - 画面全体の通知、画像一覧、保存中状態を管理する。
- `src/components/PreviewCanvas.jsx`
  - レイアウト、並べ替え、ドラッグ削除と各フック・画面部品を組み合わせる。
  - `PreviewToolbar.jsx` はズーム・ソート・画像追加操作、`SortableImage.jsx` は画像セルを表示する。
  - 削除ヒントの状態は `image-grid-combine:drag-delete-hint-dismissed:v1` に保存する。
- `src/hooks/useImageAssets.js`
  - 読込の重複防止、キャッシュ、キャンセル、解放、失敗通知を担当する。
  - `src/utils/imageAssets.js` がImageBitmap優先のデコードとHTMLImageElementへのフォールバックを実装する。
- `src/hooks/useImageExport.js`
  - 寸法検証、Canvas描画、PNG保存、Canvas解放を担当する。
  - 保存操作を `onSaveActionChange` でAppへ登録する。同時保存の防止と例外通知はAppの責務。
- `src/hooks/usePreviewZoom.js`
  - 表示領域の監視、自動フィットと手動ズームを管理する。
- `src/hooks/usePersistedSettings.js`
  - 設定の入力更新と `image-grid-combine:settings:v1` への保存・復元を担当する。
  - `src/utils/settings.js` に初期値、選択肢、アンカー一覧、正規化を集約する。
- `src/utils/imageFiles.js`
  - 初回・追加時で共通のファイル判定と除外通知を行う。
- `src/utils/imagePlacement.js`
  - プレビューと保存に共通の描画サイズ・位置を返す。
- `src/utils/gridLayout.js`
  - グリッド全体のセル配置計算。
  - `fitMode === 'original'` は、各行・列の最大原寸を基準に共通縮小率を決める専用経路。
- `src/utils/anchor.js`
  - 画像の描画サイズとアンカー位置の計算。
- `src/utils/color.js`
  - 背景色の hex 値と opacity を preview / export 用の rgba に変換する。

## 非自明な仕様

- `Fit Screen` は 100% を上限にする。
  - 小さいレイアウトを自動拡大しすぎないため。
- `Gap` は現在、number input からは負値を入れられるが、range は `0..30`。
  - これは意図的に厳密統一していない状態。
  - 変更する場合は `ControlPanel.jsx` の range / number / `handleChange` を同時に揃える。
- `max_dimensions` は contain 表示、それ以外は基本 cover 表示。
- `original` は画像ごとの原寸比を保持したまま、行高・列幅の累積から共通縮小率を決めて Output Size に収める。
- `Image Fit` と `Anchor Point` は画像の有無・縦横比にかかわらず選択できる。同じ縦横比でも原寸が違うと `original` の配置が変わる。
- 背景は `backgroundColor` と `backgroundAlpha` を別管理している。
  - preview と export の両方で同じ rgba 値を使う。

## パフォーマンス・メモリまわり

- Blob URL の解放は `App.jsx` の `updateImages` に集約している。
  - 画像削除時に個別に `URL.revokeObjectURL` する責務を他へ分散させない。
- `useImageAssets.js` の画像読込は cache + pending promise で重複起動を避けている。
- 削除済み画像や unmount 時の読込は `AbortController` で止める。
- `ImageBitmap` を使ったアセットは `close()` で解放する。
- 書き出しは `toDataURL` ではなく `toBlob` を使う。
- preview と export の画像配置計算は `getCellImagePlacement` で共有している。
  - 描画位置の仕様差分を生みにくくするため。

## 変更時の注意

- プレビューと保存結果の見た目を揃えたい変更は、`imagePlacement.js` を起点に、`SortableImage.jsx` と `useImageExport.js` の両方を見る。
- DnD の移動量は preview の `zoom` を考慮して補正している。
  - ズーム周りを変えるとドラッグ追従が壊れやすい。
- `gridLayout.js` は画像枚数が多いと計算量差が出やすい。
  - 行や列の累積値で済むものは都度足し込みに戻さない方がよい。
- SEO の基本設定は `index.html` と `public/robots.txt` / `public/sitemap.xml` にある。
  - GitHub Pages の URL やリポジトリ名を変えたら、README のリンクとあわせて更新する。

## 入力・保存の制限

- `src/utils/settings.js` で入力と保存設定の復元を正規化する。幅・高さは1〜10,000、行・列数は1〜100の整数、Gapは−100〜100。
- 余白の合計が指定寸法以上になる場合は配置を中止し、プレビューに説明を表示する。
- `src/utils/exportSize.js` でPNG保存前に両辺16,384px以下・合計1,600万画素以下を検証する。これはアプリのメモリ予算であり、全ブラウザでの成功保証ではない。
- 保存はApp側で同時実行を防止し、例外を通知する。成功・失敗ともにロックを解除し、Canvasを解放する。
