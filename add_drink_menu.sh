#!/bin/bash

# BEER ビール
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"サッポロクラシック（生）","description":"BEER ビール","price":700,"display_order":1,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"SORACHI1984（生）","description":"BEER ビール","price":800,"display_order":2,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"アサヒスーパードライ（瓶）","description":"BEER ビール","price":750,"display_order":3,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"コロナ（瓶）","description":"BEER ビール","price":700,"display_order":4,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ノンアルコール（ドライゼロ）","description":"BEER ビール","price":550,"display_order":5,"is_visible":1}'

# HIGHBALL ハイボール
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"デュワーズハイボール","description":"HIGHBALL ハイボール","price":600,"display_order":6,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"角ハイボール","description":"HIGHBALL ハイボール","price":700,"display_order":7,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ジンジャーハイボール","description":"HIGHBALL ハイボール","price":650,"display_order":8,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"コークハイボール","description":"HIGHBALL ハイボール","price":650,"display_order":9,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"レモンハイボール","description":"HIGHBALL ハイボール","price":650,"display_order":10,"is_visible":1}'

# CHUHAI チューハイ
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"チューハイ各種","description":"ライム・レモン・ピーチ・巨峰・ゆず・梅・カルピス・グレープフルーツ・シークワーサー・ウーロン・緑茶・ジャスミン・紅茶","price":600,"display_order":11,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"黒ウーロンハイ","description":"CHUHAI チューハイ","price":650,"display_order":12,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ゴロゴロレモンサワー","description":"CHUHAI チューハイ","price":700,"display_order":13,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"おかわりゴロゴロレモンサワー","description":"CHUHAI チューハイ","price":400,"display_order":14,"is_visible":1}'

# FRUIT WINE 梅酒
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"梅酒","description":"ロック・ソーダ割り・水割り","price":600,"display_order":15,"is_visible":1}'

# WINE ワイン
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"グラスワイン（赤・白）","description":"WINE ワイン","price":600,"display_order":16,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"トカップ（十勝ワイン）ハーフボトル","description":"WINE ワイン","price":1600,"display_order":17,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"トカップ（十勝ワイン）フルボトル","description":"WINE ワイン","price":2700,"display_order":18,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"MOET 白（モエ）シャンパン","description":"WINE ワイン","price":14000,"display_order":19,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"MOET ロゼ（モエ）シャンパン","description":"WINE ワイン","price":16000,"display_order":20,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"MOET ネクターインペリアル（モエ）シャンパン","description":"WINE ワイン","price":19000,"display_order":21,"is_visible":1}'

# COCKTAIL カクテル
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ジントニック","description":"COCKTAIL カクテル","price":600,"display_order":22,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ジンライム","description":"COCKTAIL カクテル","price":600,"display_order":23,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ジンバック","description":"COCKTAIL カクテル","price":600,"display_order":24,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"モスコミュール","description":"COCKTAIL カクテル","price":600,"display_order":25,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"スクリュードライバー","description":"COCKTAIL カクテル","price":600,"display_order":26,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ブルドック","description":"COCKTAIL カクテル","price":600,"display_order":27,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"クーニャン","description":"COCKTAIL カクテル","price":600,"display_order":28,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ウォッカトニック","description":"COCKTAIL カクテル","price":600,"display_order":29,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"テキーラトニック","description":"COCKTAIL カクテル","price":600,"display_order":30,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"テキーラサンライズ","description":"COCKTAIL カクテル","price":600,"display_order":31,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"テキーラコーク","description":"COCKTAIL カクテル","price":600,"display_order":32,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"カルアミルク","description":"COCKTAIL カクテル","price":600,"display_order":33,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"カシスオレンジ","description":"COCKTAIL カクテル","price":600,"display_order":34,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"カシスソーダ","description":"COCKTAIL カクテル","price":600,"display_order":35,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"カシスコーク","description":"COCKTAIL カクテル","price":600,"display_order":36,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"カシスウーロン","description":"COCKTAIL カクテル","price":600,"display_order":37,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ファジーネーブル","description":"COCKTAIL カクテル","price":600,"display_order":38,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"シャンディーガフ","description":"COCKTAIL カクテル","price":600,"display_order":39,"is_visible":1}'

# SOFTDRINK ソフトドリンク
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"コーラ","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":40,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"オレンジ","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":41,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"アップル","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":42,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"グレープフルーツ","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":43,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"カルピス","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":44,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"カルピスソーダ","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":45,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ジンジャーエール","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":46,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ウィルキンソン（辛口）","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":47,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ウーロン茶","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":48,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"緑茶","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":49,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"ジャスミン茶","description":"SOFTDRINK ソフトドリンク","price":400,"display_order":50,"is_visible":1}'
curl -s -X POST http://localhost:3000/api/admin/menu-items -H "Content-Type: application/json" -d '{"category_id":6,"name":"黒烏龍茶","description":"SOFTDRINK ソフトドリンク","price":500,"display_order":51,"is_visible":1}'

echo "All drink menu items added successfully"
