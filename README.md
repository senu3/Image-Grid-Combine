# Image Grid Combine

複数の画像を簡単にグリッド状に並べ、プレビュー画面で並び替えができる画像結合Webアプリケーションです。  
スマートフォンやタブレットにも対応しています。

[![App Website](https://img.shields.io/badge/App-Open%20on%20GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://senu3.github.io/Image-Grid-Combine/)

# 動画デモ（旧UI）
https://github.com/user-attachments/assets/8835ed65-dc79-4dd5-ad29-455979e4ff8d

- プレビューを見ながら列数を調整。行数はアプリ側が結合後の横幅に合わせていい感じにします。
- プレビュー画面で簡単に並び替え可能。

## 機能

- **一括アップロード**: ドラッグ＆ドロップまたはファイル・フォルダ選択で画像を表示。後から画像の追加も可能。
- **ドラッグ＆ドロップ並べ替え**: 直感的な操作で画像の配置順を変更可能。範囲外へのドラッグで画像を除去。
- **グリッド設定**:
    - **Layout**: 結合画像の幅指定（Width × Col）または 高さ指定（Height × Row）
    - **Spacing**: 背景色、画像間のマージン（Gap）調整。
    - **Ratio Strategy**: 各画像の比率設定。
        - Average: 全画像の平均比率に合わせる
        - Match Portrait: 最も縦長の画像に合わせる
        - Match Landscape: 最も横長の画像に合わせる
        - Max Dimensions: 含まれる画像群の最大幅・最大高さのボックスを作成し、画像を配置（余白は背景色で埋める）
    - **Anchor Point**: Match Portraitモードなどのボックスからはみ出た画像の切り抜き位置、Max Dimensionsモード時の余白ができる際の画像の配置位置（中央、右下など）を指定可能。
- **ズーム機能**: 画面に合わせてプレビューを拡大縮小（Fit Screenでウィンドウサイズに自動調整）。
- **画像の保存**: 結合した画像をpng形式で保存。
