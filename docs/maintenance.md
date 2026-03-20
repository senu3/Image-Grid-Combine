# Maintenance Notes

小さな機能追加や保守のときに、コードを全部読み直さなくて済むようにするためのメモです。

## 開発コマンド

```bash
npm run dev
npm run lint
npm run build
```

## 主要ファイル

- `src/App.jsx`
  - 画像配列の単一ソース。
  - `updateImages` で配列更新と Blob URL 解放をまとめて扱う。
- `src/components/PreviewCanvas.jsx`
  - プレビュー描画、画像メタデータ読込、ズーム、並び替え、書き出しを担当。
  - 画像アセットは `ImageBitmap` 優先、不可なら `HTMLImageElement` にフォールバック。
- `src/utils/gridLayout.js`
  - グリッド全体のセル配置計算。
  - `fitMode === 'original'` のときだけ可変セルサイズの経路がある。
- `src/utils/anchor.js`
  - 画像の描画サイズとアンカー位置の計算。

## 非自明な仕様

- `Fit Screen` は 100% を上限にする。
  - 小さいレイアウトを自動拡大しすぎないため。
- `Gap` は現在、number input からは負値を入れられるが、range は `0..30`。
  - これは意図的に厳密統一していない状態。
  - 変更する場合は `ControlPanel.jsx` の range / number / `handleChange` を同時に揃える。
- `max_dimensions` は contain 表示、それ以外は基本 cover 表示。
- `original` は比率を保持したままセル寸法自体が可変になる。

## パフォーマンス・メモリまわり

- Blob URL の解放は `App.jsx` の `updateImages` に集約している。
  - 画像削除時に個別に `URL.revokeObjectURL` する責務を他へ分散させない。
- `PreviewCanvas.jsx` の画像読込は cache + pending promise で重複起動を避けている。
- 削除済み画像や unmount 時の読込は `AbortController` で止める。
- `ImageBitmap` を使ったアセットは `close()` で解放する。
- 書き出しは `toDataURL` ではなく `toBlob` を使う。
- preview と export の画像配置計算は `getCellImagePlacement` で共有している。
  - 描画位置の仕様差分を生みにくくするため。

## 変更時の注意

- プレビューと保存結果の見た目を揃えたい変更は、`PreviewCanvas.jsx` の preview 側と export 側の両方を見る。
- DnD の移動量は preview の `zoom` を考慮して補正している。
  - ズーム周りを変えるとドラッグ追従が壊れやすい。
- `gridLayout.js` は画像枚数が多いと計算量差が出やすい。
  - 行や列の累積値で済むものは都度足し込みに戻さない方がよい。
