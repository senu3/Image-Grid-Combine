# Image Grid Combine

複数の画像をプレビューしながら簡単にグリッド結合ができる画像結合Webアプリケーションです。   
[![App Website](https://img.shields.io/badge/App-Open%20on%20GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://senu3.github.io/Image-Grid-Combine/)

- プレビューを見ながら列数を調整。行数は自動的に調整されます。  
- プレビュー画面で簡単に並び替え可能。
- 豊富な縦横比設定。　　

## スクリーンショット
<img width="4421" height="1200" alt="grid_combine_1768048776285" src="https://github.com/user-attachments/assets/f4493eae-5e50-4db5-9c6f-0094bbd2ca3a" />

- 動画デモ（旧UI）

https://github.com/user-attachments/assets/8835ed65-dc79-4dd5-ad29-455979e4ff8d

## 機能

- **一括アップロード**: ドラッグ＆ドロップまたはファイル・フォルダ選択で画像を表示。後から画像の追加も可能。
- **ドラッグ＆ドロップ並べ替え**: 直感的な操作で画像の配置順を変更可能。範囲外へのドラッグで画像を除去。
- **グリッド設定**:
    - **Layout**: 結合画像の幅指定（Width × Col）または 高さ指定（Height × Row）
    - **Spacing**: 背景色、画像間のマージン（Gap）調整。
    - **FitMode**: 各画像の比率設定。
        - Average: 全画像の平均比率に合わせる
        - Match Portrait: 最も縦長の画像に合わせる
        - Match Landscape: 最も横長の画像に合わせる
        - Max Dimensions: 含まれる画像群の最大幅・最大高さのボックスを作成し、画像を配置（余白は背景色で埋める）
        - Original (No Crop): 画像を元の比率で配置
    - **Anchor Point**: Match Portraitモードなどのボックスからはみ出た画像の切り抜き位置、Max Dimensionsモード時の余白ができる際の画像の配置位置（中央、右下など）を指定可能。
- **ズーム機能**: 画面に合わせてプレビューを拡大縮小（Fit Screenでウィンドウサイズに自動調整）。
- **画像の保存**: 結合した画像をpng形式で保存。
