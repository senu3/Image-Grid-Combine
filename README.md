# Image Grid Combine

複数の画像をプレビューしながら簡単にグリッド結合ができる画像結合Webアプリケーションです。   
[![App Website](https://img.shields.io/badge/App-Open%20on%20GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://senu3.github.io/Image-Grid-Combine/)

- プレビューを見ながら Width × Col / Height × Row を切り替えて出力サイズを調整。  
- プレビュー画面で簡単に並び替え、範囲外へのドラッグで削除可能。
- Image Fit と Anchor Point を含む豊富なレイアウト調整。　　

## スクリーンショット
<img width="4421" height="1200" alt="grid_combine_1768048776285" src="https://github.com/user-attachments/assets/f4493eae-5e50-4db5-9c6f-0094bbd2ca3a" />

- 動画デモ（旧UI）

https://github.com/user-attachments/assets/8835ed65-dc79-4dd5-ad29-455979e4ff8d

## 機能

- **一括アップロード**: ドラッグ＆ドロップまたはファイル選択で画像を表示。後から画像の追加も可能。
- **ドラッグ＆ドロップ並べ替え**: 直感的な操作で画像の配置順を変更可能。範囲外へのドラッグで画像を除去。
- **グリッド設定**:
    - **Layout**: 結合画像の幅指定（Width × Col）または 高さ指定（Height × Row）
    - **Output Size**: Total Width または Total Height を指定可能。
    - **Spacing**: 背景色、透過度、画像間のマージン（Gap）調整。
    - **Image Fit**: 各画像の比率設定。
        - Standard: 全画像の見た目を均しやすい標準設定
        - Portrait Priority: 縦長の画像を優先してセル内の見え方を合わせる
        - Landscape Priority: 横長の画像を優先してセル内の見え方を合わせる
        - Contain: 画像全体がセル内に収まるように配置
        - No Crop: 共通縮小率で原寸比を保ったまま Output Size に収まるように配置
    - **Anchor Point**: 画像の切り抜き位置、または余白ができる際の画像の配置位置（中央、右下など）を指定可能。
- **設定の保存**: Layout、Output Size、Spacing、Image Fit などの主要設定をブラウザに保存。
- **ズーム機能**: 画面に合わせてプレビューを拡大縮小（Fit Screenでウィンドウサイズに自動調整）。
- **画像の保存**: 結合した画像を PNG 形式で保存。

## 開発メモ

- メンテナンス時の内部仕様メモは [docs/maintenance.md](docs/maintenance.md) を参照してください。
