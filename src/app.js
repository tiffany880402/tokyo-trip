import { configured, watchAuth, signInGoogle, logOut, findMyTrip, createTrip, joinTrip, tripDB } from './firebase.js';

let AUTH = null, TRIP = null;
const MEMBER_DATA = {};

/* ---------- Data（來源：Notion「2026 年末東京自由行」） ---------- */
const WD = ['日','一','二','三','四','五','六'];
const DAYS = [
 { date:'2026-12-29', photo:'d1', pos:'50% 60%', wd:2, scene:'tower', area:'池袋', cl:[10,2], title:'抵達東京・池袋 Chiikawa',
   items:[
 {t:'04:50', ti:'從家裡出發', d:'出發去桃園機場第二航廈。', dur:'1 小時', ic:'home'},
 {t:'05:50', ti:'抵達桃園二航', d:'長榮櫃檯報到、託運（23kg × 1，手提 7kg × 1）。行動電源放手提行李。', dur:'2 小時', ic:'plane', q:'桃園國際機場 第二航廈'},
 {flight:'out'},
 {t:'12:00', ti:'抵達成田機場啦！', d:'成田第一航廈。默默等待出境，領行李。日本比台灣快 1 小時。', dur:'1 小時', ic:'plane', q:'成田国際空港'},
 {t:'13:18', ti:'成田空港 → 日暮里', d:'Skyliner 130 號，13:18 發，14:04 日暮里到啦。', dur:'46 分', ic:'train', q:'成田空港駅 京成スカイライナー'},
 {t:'14:04', ti:'日暮里 → 鶯谷', d:'山手線（上野・東京方面／外環線），一站而已。', dur:'1 分', ic:'train', q:'日暮里駅'},
 {t:'14:30', ti:'先寄放個行李・LANDABOUT', d:'鶯谷站走 3 分鐘（有一段下坡），行李寄放好再出門。', dur:'30 分', ic:'hotel', q:'LANDABOUT TOKYO 根岸3-4-5'},
 {t:'15:00', ti:'鶯谷 → 池袋', d:'山手線（池袋・新宿方面／內環線），約 20 分鐘。', dur:'20 分', ic:'train', q:'池袋駅'},
 {t:'15:20', photo:'b_26_000', ti:'I’m donut?（池袋店）', d:'發跡於福岡的生甜甜圈專賣店，被稱作「既像甜甜圈又不像甜甜圈」。點餐要自己在單子上寫好再交出去，只收無現金支付。', dur:'1 小時', ic:'cafe', q:'I\'m donut? 池袋'},
 {t:'16:20', photo:'b_27_002', ti:'吉伊卡哇樂園 Chiikawa Park', d:'逛個兩小時！B1F 體驗展示區有 14 個主題空間，第一間是 4 公尺高的三面環繞劇場。全場只收無現金，沒有置物櫃。', dur:'1 小時 40 分', ic:'shop', q:'ちいかわパーク サンシャインシティ アネックス',
   tips:['髮箍販售區是 B1F 唯一能買周邊的地方，中央那棵大樹的鬍子會上下動','海獺巡邏車可以坐進去拍照，就在「夜之森」入口前','惡夢房間、哥布林牢房、拾魔都在動線上','最後的粉絲見面會：吉伊卡哇、小八、兔兔、小桃鼠隨機出現兩位，遇到誰全靠緣分']},
 {t:'18:00', photo:'b_30_000', ti:'晚餐時間', d:'來吃個晚餐吧！無敵家、立食美登利、大眾燒肉 KOGUMAYA 三選一。', dur:'1 小時', ic:'food', food:0, q:'池袋駅 東口'},
 {t:'19:00', photo:'b_29_006', ti:'抓娃娃時間・太陽城', d:'找娃娃抓！池袋太陽城的扭蛋中心。主樓 Sunshine 60 在 1978 年是日本最高的大樓。', dur:'2 小時', ic:'shop', q:'ガシャポンのデパート 池袋総本店'},
 {t:'21:00', ti:'池袋 → 鶯谷', d:'21:00 前出發，山手線（上野・東京方面／外環線）。', dur:'20 分', ic:'train', q:'鶯谷駅'},
 {t:'21:30', ti:'LANDABOUT Check in', d:'辦入住，洗澡睡覺晚安摟！明天 7:30 要出門去富士山。', dur:'', ic:'hotel', q:'LANDABOUT TOKYO 根岸3-4-5'}
],
   food:[{name:'池袋晚餐', list:[
     {n:'無敵家（麵創房 無敵家）', h:'10:30–凌晨 4:00', x:'1994 年開業的排隊名店，豬大骨熬 13 小時。人氣第一是ニクタマラーメン（叉燒蛋拉麵）'},
     {n:'立食美登利 Echika 池袋店', h:'11:00–22:30', x:'梅丘壽司之美登利的立食分店，一貫 50 日圓起，必點穴子一本握'},
     {n:'大眾燒肉 KOGUMAYA（小熊屋）', h:'15:00–23:30・不定休・不能刷卡', x:'便宜的老派燒肉，小熊牛五花只要 500 日圓，招牌成吉思汗烤羊肉配高麗菜醬'},
     {n:'Yellow 池袋（蛋包飯）', h:'11:00–22:00', x:'蛋包會在面前切開攤開，很適合拍影片'}
   ]}]
 },
 { date:'2026-12-30', photo:'d2', pos:'50% 50%', wd:3, scene:'fuji', area:'富士山・河口湖', cl:[5,-5], title:'富士山一日遊',
   items:[
 {t:'07:40', ti:'鶯谷 → 新宿', d:'06:30 起床整理，07:30 飯店出發。山手線（池袋・新宿方面／內環線），約 30 分鐘。', dur:'30 分', ic:'train', q:'鶯谷駅'},
 {t:'08:30', ti:'新宿 → 下吉田', d:'富士回遊 7 號，08:30 準時發車，10:13 到下吉田。08:15 前到中央線特急月台，可以先買早餐。往河口湖方向坐右側窗邊看富士山。', dur:'1 小時 43 分', ic:'train', q:'新宿駅',
   tips:['單程約 ¥2,580，用西瓜卡要多儲值','去回程的票都要在東京市區 JR 東日本車站先領好，回程票在河口湖領不到']},
 {t:'10:25', photo:'b_34_000', ti:'新倉山淺間公園', d:'下吉田站走 10 分鐘。爬約 400 階的「咲くや姫階段」到忠靈塔，五重塔＋富士山的絕景，11:20 慢慢晃下山。', dur:'1 小時', ic:'shrine', q:'新倉山浅間公園'},
 {t:'11:45', photo:'b_34_002', ti:'本町商店街', d:'筆直朝著富士山延伸的「富士みち」。經典角度在本町二丁目路口，老鐘錶行「日川時計店」的招牌會入鏡。', dur:'30 分', ic:'walk', q:'富士吉田 本町二丁目'},
 {t:'12:15', photo:'b_34_004', ti:'往富士山方向慢慢走', d:'沿本町通一路往上，富士山越來越大。路邊還留著昭和老店，走到盡頭是金鳥居，再過去就是富士山站。', dur:'45 分', ic:'walk', q:'金鳥居 富士吉田'},
 {t:'13:00', ti:'富士山 → 河口湖', d:'富士山站搭富士急行線到河口湖站。', dur:'15 分', ic:'train', q:'富士山駅'},
 {t:'13:25', photo:'b_35_008', ti:'LAWSON 拍富士山・午餐', d:'找地方吃飯！ほうとう（味噌寬麵鍋）選項在這裡。人太多可以去「LAWSON 河口湖町役場前店」，人行道比較寬。', dur:'1.5 小時', ic:'food', food:0, q:'ローソン 河口湖駅前店'},
 {t:'15:00', ti:'河口湖 → うぶや前', d:'河口湖站搭紅線周遊巴士，15 分鐘。', dur:'15 分', ic:'train', q:'河口湖駅'},
 {t:'15:20', photo:'b_35_000', ti:'產屋ヶ崎', d:'河口湖東岸的小岬角，晴天沒浪時會看到湖面倒映的「逆富士」，河口湖大橋也能一起入鏡。', dur:'30 分', ic:'view', q:'産屋ヶ崎'},
 {t:'15:52', ti:'うぶや前 → 河口湖', d:'紅線周遊巴士，16:09 到河口湖站。有 20 分鐘速買奇怪的紀念品。', dur:'17 分', ic:'train', q:'河口湖駅'},
 {t:'16:48', ti:'河口湖 → 新宿', d:'富士回遊 44 號，16:48 發，18:43 到新宿。', dur:'1 小時 55 分', ic:'train', q:'河口湖駅'},
 {t:'19:15', photo:'b_36_004', ti:'焼肉どんどん 新宿歌舞伎町店', d:'吃烤肉！招牌蔥鹽牛舌：一面烤好後把蔥捲在牛舌裡吃，收尾推薦どんどん冷麵。營業到凌晨 5:00。', dur:'1.5 小時', ic:'food', q:'焼肉どんどん 新宿歌舞伎町店'},
 {t:'21:00', ti:'新宿 → 鶯谷', d:'山手線（池袋・上野方面／外環線）。晚安美好的富士山！', dur:'30 分', ic:'train', q:'鶯谷駅'}
],
   food:[{name:'河口湖午餐', list:[
     {n:'名物ほうとう不動 東恋路店', h:'11:00–20:00', x:'雲朵形狀的建築，出自建築師保坂猛'},
     {n:'甲州ほうとう小作 河口湖店', h:'11:00–19:30', x:'人氣第一是南瓜ほうとう'},
     {n:'名物ほうとう不動 河口湖駅前店', h:'11:00–19:00', x:'和東恋路店同一家，口味一樣，離車站近'}
   ]}]
 },
 { date:'2026-12-31', photo:'d3', pos:'50% 60%', wd:4, scene:'city', area:'築地・銀座・秋葉原', cl:[10,2], title:'大晦日：築地・銀座・秋葉原',
   note:'12/31 很多店會提早關，晚上的店出發前再確認一次。',
   items:[
 {t:'10:00', ti:'入谷 → 築地', d:'09:00 舒服起床，10:00 出發。日比谷線直達築地。', dur:'20 分', ic:'train', q:'入谷駅'},
 {t:'10:30', photo:'b_41_004', ti:'築地場外市場', d:'反正找東西吃！12/31 是市場休市日，部分店家有開。推薦的店在這裡。', dur:'2 小時', ic:'food', food:0, q:'築地場外市場'},
 {t:'12:30', photo:'b_38_000', ti:'銀座・Shake Shack', d:'慢慢走去銀座，走走晃晃吃漢堡。4 丁目路口頂著大時鐘的「和光」是銀座最代表性的畫面。', dur:'3 小時', ic:'shop', food:1, q:'シェイクシャック 銀座',
   tips:['奧野大樓（1932 年的昭和老公寓）：老電梯裡還有一道鏤空鐵門要自己拉開','年末百貨可能提早關門']},
 {t:'15:30', photo:'b_39_000', ti:'東京車站・一番街', d:'銀座走過來約 2 分鐘車程。丸之內口記得抬頭看圓頂的生肖雕刻；一番街有拉麵街和東京車站限定伴手禮，很多店可以退稅。', dur:'2.5 小時', ic:'shop', q:'東京駅一番街',
   tips:['圓頂裡只有 8 隻生肖，可以數數看少了哪幾隻','從八重洲地下中央口改札出來就是一番街']},
 {t:'18:00', photo:'b_40_000', ti:'神秘秋葉原', d:'山手線（上野・池袋方面／內環線）。逛電器街、Super Potato、秋葉原扭蛋會館。', dur:'1.5 小時', ic:'shop', q:'秋葉原駅',
   tips:['月台上的牛奶站ミルクショップ酪：JR 總武線 6 號月台（往千葉方向），喝完瓶子當場還','年末店家可能提早關']},
 {t:'19:40', ti:'末廣町 → 上野廣小路', d:'銀座線（往淺草），一站。', dur:'5 分', ic:'train', q:'末広町駅'},
 {t:'20:00', photo:'b_42_006', ti:'極や 上野廣小路店', d:'我是那個蝦蝦拉麵！必點特製鮮蝦濃湯拉麵（海老ポタらぁめん）。營業 11:00 到凌晨 6:00。', dur:'1 小時', ic:'food', q:'俺の創作らぁめん 極や 上野広小路店',
   warn:['年末營業','出發前確認 12/31 有沒有開。']},
 {t:'21:00', ti:'御徒町 → 鶯谷', d:'山手線（上野・池袋方面／內環線）。回飯店看電視跨年，Happy new year！', dur:'10 分', ic:'train', q:'御徒町駅'}
],
   food:[
    {name:'築地場外市場', list:[
     {n:'つきぢ松露 築地本店', h:'平日 6:00–15:00・假日和休市日 7:00–16:00', x:'玉子燒，甜度不高、味道清爽'},
     {n:'まぐろや黒銀', h:'7:30–15:00', x:'鮪魚專賣，人氣鮪魚大捲'},
     {n:'まるきた 2 号店', h:'5:00–23:00', x:'鮭魚・鮪魚丼，11 種海鮮的おまかせ丼 3,080 日圓'},
     {n:'北海番屋', h:'9:00–15:00', x:'海膽鮭魚卵丼，北海丼是女生人氣第一'}
    ]},
    {name:'銀座吃的', list:[
     {n:'Shake Shack', h:'11:00–22:00', x:'紐約漢堡，甜點 Concrete'},
     {n:'銀座 篝 本店', h:'11:00–22:00', x:'雞白湯 SOBA，湯頭像奶油一樣濃'},
     {n:'五代目 花山烏冬 銀座店', h:'平日 11:00–15:30、17:30–21:30', x:'招牌超寬「鬼ひも川」'}
    ]}
   ]
 },
 { date:'2027-01-01', photo:'d4', pos:'28% 50%', wd:5, scene:'tower', area:'駒込・麻布・五反田', cl:[10,2], title:'元旦：妙義神社・東京鐵塔・目黑川',
   note:'元旦很多店休息，午餐和晚餐出發前再確認有沒有開。',
   items:[
 {t:'09:00', ti:'鶯谷 → 駒込', d:'08:00 起床刷牙，09:00 出門摟。山手線（池袋・新宿方面／內環線）。', dur:'15 分', ic:'train', q:'鶯谷駅'},
 {t:'09:15', photo:'b_45_002', ti:'妙義神社', d:'豐島區最古老的神社，約 1300 年歷史。祈求喵喵們平安健康！社貓 Mugi 君常趴在授與所窗口曬太陽。', dur:'45 分', ic:'shrine', q:'妙義神社 駒込'},
 {t:'10:00', ti:'駒込 → 麻布十番', d:'南北線（往白金高輪），出發去拍照。', dur:'20 分', ic:'train', q:'駒込駅'},
 {t:'10:30', photo:'u_akabane', ti:'東京鐵塔拍照巡禮', d:'赤羽橋 E21 出口 → 芝公園 → とうふ屋うかい斜坡。', dur:'2 小時', ic:'view', q:'赤羽橋駅 赤羽橋口',
   tips:['赤羽橋站 E21 出口：出站右手邊過馬路，靠在欄杆上和路牌、鐵塔同框','芝公園：往鐵塔方向走，對面就是公園長椅','とうふ屋うかい附近的斜坡，上方停車場招牌旁的機位要排比較久']},
 {t:'12:30', photo:'u_stairs', ti:'午餐・東京鐵塔 Foot Town', d:'肚子餓了吧，找找東京鐵塔 Foot Town 裡有什麼吃。', dur:'1 小時', ic:'food', q:'東京タワー フットタウン'},
 {t:'13:30', photo:'b_47_000', ti:'麻布十番商店街', d:'散步前往麻布，狸貓煎餅、鯛魚燒、甜甜圈、串燒都在這條街。', dur:'1.5 小時', ic:'walk', food:0, q:'麻布十番商店街'},
 {t:'15:00', photo:'u_maman', ti:'六本木 Hills', d:'六本木逛逛，廣場看大蜘蛛雕塑「Maman」。', dur:'1 小時', ic:'view', q:'六本木ヒルズ ママン'},
 {t:'16:00', ti:'六本木 → 五反田', d:'日比谷線到惠比壽，轉山手線（品川・東京方面／內環線）5 分鐘到五反田。', dur:'25 分', ic:'train', q:'六本木駅'},
 {t:'17:30', photo:'b_48_000', ti:'五反田晚餐', d:'肚子應該餓了吧！漢堡排、拉麵、沾麵、烏龍麵都在這裡。', dur:'1 小時', ic:'food', food:1, q:'五反田駅'},
 {t:'18:30', photo:'b_46_004', ti:'目黑川燈飾', d:'約 41 萬顆櫻花粉色 LED 的「冬之櫻」，沿河岸綿延 2.2 公里。每天 17:00–22:00 點燈，免費。五反田站走約 6 分鐘。', dur:'1.5 小時', ic:'walk', q:'五反田ふれあい水辺広場',
   tips:['活動期間 2026/12/4–2027/1/31','地點：品川區立五反田親水廣場、目黑川沿岸步道']},
 {t:'20:00', ti:'五反田 → 鶯谷', d:'山手線（品川・東京方面／內環線）。或是去逛藥妝店、吃一蘭拉麵。', dur:'30 分', ic:'train', q:'五反田駅'}
],
   food:[
    {name:'麻布十番', list:[
     {n:'たぬき煎餅（狸貓煎餅）', x:'店門口現烤的狸貓造型煎餅，夾起司的「たぬ吉」也好吃'},
     {n:'浪花家總本店', x:'1909 年創業的鯛魚燒，北海道十勝紅豆熬 8 小時'},
     {n:'DUMBO Doughnuts and Coffee', x:'粉紅色紐約風甜甜圈，直徑 11 公分'},
     {n:'あべちゃん（串燒）', h:'14:45 開始・週日公休', x:'1933 年創業的烤串老店'},
     {n:'花一會', x:''}
    ]},
    {name:'五反田晚餐', list:[
     {n:'Meat矢澤 五反田本店', x:'黑毛和牛漢堡排'},
     {n:'京都北白川ラーメン魁力屋', h:'10:30–凌晨 1:00', x:'京都背脂醬油拉麵'},
     {n:'三田製麺所 五反田店', h:'11:00–22:30', x:'濃厚沾麵約 ¥1,080，小盛到大盛同價'},
     {n:'ONIYANMA 五反田本店', h:'07:00–03:00', x:'立食烏龍麵，招牌炸雞醬汁烏龍冷麵'}
    ]}
   ]
 },
 { date:'2027-01-02', photo:'d5', pos:'50% 55%', wd:6, scene:'shrine', area:'上野・晴空塔・淺草', cl:[10,2], title:'上野動物園・晴空塔・淺草',
   items:[
 {t:'09:30', photo:'b_51_002', ti:'上野動物園', d:'走路過去！必看 2025 年 7 月出生的蘇門答臘虎寶寶，還有兔猻、「不動之鳥」鯨頭鸛。西園有歐卡皮、侏儒河馬，可以摸天竺鼠和兔子。', dur:'2.5 小時', ic:'view', q:'恩賜上野動物園 表門'},
 {t:'12:00', ti:'ヤマシロヤ 玩具', d:'玩具店是必須要的！上野站廣小路口。', dur:'1 小時', ic:'shop', q:'ヤマシロヤ 上野'},
 {t:'13:00', ti:'上野 → 淺草 → 押上', d:'銀座線到淺草，轉淺草線到押上，前往晴空塔。', dur:'20 分', ic:'train', q:'上野駅'},
 {t:'14:00', photo:'b_50_000', ti:'敘敘苑 晴空塔ソラマチ店', d:'烤肉時間到！30–31 樓「Solamachi Dining Sky Tree View」，高約 150 公尺，希望是面向外面的位子。', dur:'1.5 小時', ic:'food', q:'叙々苑 東京スカイツリータウン・ソラマチ店'},
 {t:'16:00', photo:'b_53_002', ti:'淺草寺・仲見世・傳法院通', d:'吃飽走去淺草，拍照晃晃看東西。1/1–1/7 是新年大祈禱會。仲見世必吃木村家本店人形燒、淺草九重炸饅頭。', dur:'3 小時', ic:'shrine', q:'浅草寺',
   warn:['傳法院通','PDF 寫老店預計 2026 年 7 月底熄燈，1 月去的時候可能已經關了。']},
 {t:'19:30', photo:'b_50_002', ti:'WAGYU SUKIYAKI 極 GOKU', d:'壽喜燒晚餐！一人一鍋自己煮，A5 和牛，白飯、味噌湯、蛋都能免費續，最後一道是松露蛋拌飯。', dur:'2 小時', ic:'food', q:'WAGYU SUKIYAKI 極 GOKU 浅草'},
 {t:'21:40', ti:'淺草 → 上野 → 入谷', d:'銀座線到上野，轉日比谷線到入谷，22:00 回到飯店。', dur:'20 分', ic:'train', q:'浅草駅'}
],
   food:[]
 },
 { date:'2027-01-03', photo:'b_58_002', pos:'50% 50%', wd:0, scene:'city', area:'新宿・橫濱', cl:[10,3], title:'新宿購物・橫濱夜景',
   items:[
 {t:'09:00', ti:'鶯谷 → 新宿', d:'08:00 起床刷牙，09:00 出門。山手線（池袋・新宿方面／內環線）。', dur:'30 分', ic:'train', q:'鶯谷駅'},
 {t:'09:30', photo:'b_55_002', ti:'新宿吃早餐', d:'Sarabeth’s、Cafe AALIYA 的法式吐司、澤村 NEWoMan 三選一。', dur:'1 小時', ic:'cafe', food:0, q:'新宿三丁目'},
 {t:'10:30', photo:'b_56_002', ti:'新宿百貨逛逛', d:'反正就是百貨逛逛，去 Alpen 看睡袋嗎！', dur:'2 小時', ic:'shop', q:'新宿駅 東口'},
 {t:'12:30', photo:'b_55_000', ti:'AFURI 辛紅', d:'AFURI 的辛辣概念店，招牌「柚子辛紅拉麵」：雞清湯加辣椒、辣味噌和高知柚子汁。不收現金。', dur:'1 小時', ic:'food', q:'AFURI 辛紅 新宿サブナード'},
 {t:'13:30', photo:'b_56_004', ti:'歌舞伎町・哥吉拉', d:'Hotel Gracery 頂樓的哥吉拉頭，從歌舞伎町一番街抬頭就拍得到。新宿區還發給牠「特別住民票」。', dur:'1 小時', ic:'view', q:'ゴジラヘッド 新宿'},
 {t:'15:00', ti:'新宿 → 日本大通', d:'湘南新宿線到橫濱，轉港未來線 3 站到日本大通。', dur:'50 分', ic:'train', q:'新宿駅'},
 {t:'16:40', photo:'b_58_000', ti:'大さん橋屋頂看日落', d:'橫濱港的木棧道屋頂，看港未來的日落和夜景。', dur:'20 分', ic:'view', q:'大さん橋'},
 {t:'17:00', photo:'b_58_002', ti:'紅磚倉庫', d:'以前的海關倉庫，2002 年變成商場。冷知識：樓層圖只到 3 樓，外面看 4 樓卻有窗戶。', dur:'1 小時', ic:'shop', q:'横浜赤レンガ倉庫'},
 {t:'18:00', photo:'b_58_006', ti:'中華街逛起來', d:'走去中華街到處看看、吃點小東西，再往橫濱站移動。', dur:'30 分', ic:'shop', q:'横浜中華街'},
 {t:'18:30', ti:'晚餐・吉村家', d:'橫濱站的家系拉麵始祖！吃飽回家，或再逛逛。', dur:'1.5 小時', ic:'food', q:'家系総本山 吉村家'},
 {t:'20:00', ti:'橫濱 → 鶯谷', d:'京濱東北線直達。要不要 21:00 去逛藥妝店？22:00 回飯店睡覺。', dur:'45 分', ic:'train', q:'横浜駅'}
],
   food:[{name:'新宿早餐', list:[
     {n:'Sarabeth’s Lumine 新宿店', x:'紐約早午餐'},
     {n:'Cafe AALIYA', x:'法式吐司有名的老咖啡廳，在伊勢丹斜對面，走下樓梯就是'},
     {n:'澤村 NEWoMan 新宿', x:'麵包、早餐'}
   ]}]
 },
 { date:'2027-01-04', photo:'b_61_000', pos:'50% 62%', wd:1, scene:'shrine', area:'明治神宮・表參道・澀谷', cl:[10,3], title:'明治神宮・表參道・SHIBUYA SKY',
   items:[
 {t:'09:40', ti:'鶯谷 → 代代木', d:'08:30 起床刷牙洗臉，09:30 出門溜搭溜搭。山手線（池袋・新宿方面／內環線）。', dur:'20 分', ic:'train', q:'鶯谷駅'},
 {t:'10:00', photo:'b_61_002', ti:'明治神宮', d:'供奉明治天皇和昭憲皇太后，1920 年 11 月 1 日創建，新年參拜人數年年日本第一。整片森林是人造的：全國捐來約 10 萬棵樹，現在完全看不出是人工林。供奉的是感情很好的天皇夫妻，所以求戀愛運、好姻緣。', dur:'1 小時', ic:'shrine', q:'明治神宮',
   tips:['大鳥居：用樹齡超過 1,500 年的台灣檜木做的，高 12 公尺，是日本最大的木造明神鳥居','酒樽牆：參道一邊是日本清酒桶、一邊是葡萄酒桶，象徵明治時代把外國文化和日本傳統結合在一起','特別的籤「大御心」：不分吉凶，寫的是明治天皇和皇后作的 30 首和歌，附解說。黃色是皇后的、白色是天皇的，給祈求的人一個方向']},
 {t:'11:00', photo:'b_62_004', ti:'表參道開始逛街！', d:'@cosme TOKYO、KIDDY LAND 💸 表參道本來就是通往明治神宮的參道，現在是名牌和流行服飾聚集的地方。', dur:'1 小時', ic:'shop', q:'@cosme TOKYO',
   tips:['參道上種了 157 棵櫸樹，真的有人一棵一棵數過','OMOKADO 屋頂的「OMOHARA 之森」種了 34 棵在地樹木，樹下散放約 70 個設計師椅子','原宿：江戶時代住著伊賀忍者；東京最古老的木造車站已經拆掉，改建成新車站。西口往明治神宮，東口接表參道']},
 {t:'12:00', photo:'b_60_000', ti:'找中餐吃', d:'一路上找找吃的：麺散、SHANTi 原宿店、AFURI 原宿。', dur:'2 小時', ic:'food', food:0, q:'麺散 原宿'},
 {t:'14:00', photo:'b_62_010', ti:'Topologie 原宿旗艦店', d:'繼續散步看表參道。', dur:'30 分', ic:'shop', q:'Topologie 原宿'},
 {t:'14:30', photo:'w_meijidori', ti:'沿明治通り走到澀谷', d:'邊走邊逛，走路過去。', dur:'30 分', ic:'walk', q:'明治通り 渋谷'},
 {t:'15:00', photo:'b_63_006', ti:'澀谷小八拍照', d:'忠犬八公像拍照，再走去 PUPPET SUNSUN STORE。', dur:'45 分', ic:'view', q:'ハチ公像',
   tips:['八公是秋田犬，主人是東京帝國大學的上野英三郎教授，每天在澀谷站等主人下班','1925 年教授過世後，八公還是每天到車站等，等了約 10 年，直到 1935 年過世','站前的「澀谷十字路口」人多的時候，一次綠燈就有大約 3,000 人同時過馬路']},
 {t:'15:45', photo:'b_63_000', pos:'50% 75%', ti:'SHIBUYA SKY', d:'15:45 準備上去排隊，16:00 上頂樓。1 月初日落大約 16:40，剛好從夕陽看到夜景。', dur:'2 小時', ic:'view', q:'SHIBUYA SKY',
   tips:['在 Shibuya Scramble Square 的 14 樓、45 樓、46 樓和頂樓，離地 229 公尺，是澀谷最高的地方','2019 年秋天開幕','頂樓「SKY STAGE」是露天的，可以從正上方往下看十字路口']},
 {t:'18:00', photo:'w_shibuya_xmas', ti:'晚餐・極味や 澀谷 PARCO', d:'澀谷逛起來⛄ 找飯吃！', dur:'2 小時', ic:'food', q:'極味や 渋谷パルコ'},
 {t:'20:00', ti:'澀谷 → 鶯谷', d:'山手線（新宿・池袋方面／外環線）。', dur:'35 分', ic:'train', q:'渋谷駅'},
 {t:'21:00', ti:'洗洗睡吧・收行李', d:'明天就要回家了，把行李和伴手禮收好！', dur:'', ic:'hotel', q:'LANDABOUT TOKYO 根岸3-4-5'}
],
   food:[{name:'原宿午餐', list:[
     {n:'麺散（讚岐烏龍麵）', h:'11:30–22:00', x:'從簡單的讚岐烏龍麵到炒烏龍麵都有，現擀、現切、現煮，Q 彈有嚼勁。配菜也好吃，特別是鮪魚醃蘿蔔飯糰'},
     {n:'SHANTi（湯咖哩）原宿店', h:'11:00–23:30', x:'2001 年在北海道創立的湯咖哩老店。帶骨雞腿和新鮮蔬菜大塊放進湯咖哩，辣度分 40 段以上可以自己調；配白飯、烤餅（naan），也能選花椰菜飯'},
     {n:'AFURI 原宿', x:'柚子鹽拉麵'}
   ]}]
 },
 { date:'2027-01-05', wd:2, scene:'tower', area:'東京 → 桃園', cl:[10,2], title:'Bye Tokyo・回家囉',
   items:[
 {t:'08:00', ti:'起床刷牙・退房', d:'今天要回家啦！09:30 出門出門出出門。最後檢查護照、伴手禮、行動電源。', dur:'1.5 小時', ic:'hotel', q:'LANDABOUT TOKYO 根岸3-4-5'},
 {t:'09:40', photo:'w_nippori', ti:'鶯谷 → 日暮里', d:'山手線去搭車，1 站到日暮里轉京成 Skyliner。', dur:'5 分', ic:'train', q:'日暮里駅 京成'},
 {t:'10:05', photo:'w_keiseiueno', ti:'Skyliner 127 號', d:'日暮里 10:05 發 → 成田空港站（第一航廈）10:57。', dur:'52 分', ic:'train', q:'日暮里駅 京成スカイライナー'},
 {t:'10:57', photo:'w_naritasta', ti:'成田機場到啦・第一航廈', d:'長榮櫃檯托運（23kg × 1，手提 7kg × 1）、過安檢。行動電源只能放手提行李。', dur:'2 小時', ic:'plane', food:0, q:'成田国際空港 第1ターミナル',
   tips:['有沒有需要退稅呢？免稅商品記得在出境前處理好']},
 {flight:'back'},
 {t:'16:05', photo:'w_tpe', ti:'抵達台灣・準備回家！', d:'16:30 撿行李時間，然後回溫暖滴家！！最棒的東京之旅 🎉', dur:'', ic:'home'}
],
   food:[{name:'手冊推薦', list:[
     {n:'鐵板燒 道頓堀 栗田', x:'有經典的「元祖大阪燒」和「元祖摩登燒」，還有「秘傳醬汁炒麵」、「章魚燒」等大阪代表美食，選擇很多，在東京也能吃到關西風味'}
   ]}]
 }
];

const FLIGHTS = {
  out:{no:'EVA BR184', from:['桃園 T2','TPE','07:55'], to:['成田 T1','NRT','12:00'], dur:'3h 05m', note:'TAOYUAN → TOKYO'},
  back:{no:'EVA BR183', from:['成田 T1','NRT','13:00'], to:['桃園 T2','TPE','16:05'], dur:'4h 05m', note:'TOKYO → TAOYUAN'}
};

/* ---------- Photos ---------- */
const PHOTOS = {"d1": "./photos/d1.jpg", "d2": "./photos/d2.jpg", "d3": "./photos/d3.jpg", "d4": "./photos/d4.jpg", "d5": "./photos/d5.jpg", "d6": "./photos/d6.jpg", "w_kamakura": "./photos/w_kamakura.jpg", "w_hachimangu": "./photos/w_hachimangu.jpg", "w_enoden": "./photos/w_enoden.jpg", "w_enoshima": "./photos/w_enoshima.jpg", "w_nippori": "./photos/w_nippori.jpg", "w_keiseiueno": "./photos/w_keiseiueno.jpg", "w_naritasta": "./photos/w_naritasta.jpg", "w_tpe": "./photos/w_tpe.jpg", "b_26_000": "./photos/b_26_000.jpg", "b_27_002": "./photos/b_27_002.jpg", "b_29_006": "./photos/b_29_006.jpg", "b_30_000": "./photos/b_30_000.jpg", "b_34_000": "./photos/b_34_000.jpg", "b_34_002": "./photos/b_34_002.jpg", "b_34_004": "./photos/b_34_004.jpg", "b_35_000": "./photos/b_35_000.jpg", "b_35_008": "./photos/b_35_008.jpg", "b_36_004": "./photos/b_36_004.jpg", "b_38_000": "./photos/b_38_000.jpg", "b_39_000": "./photos/b_39_000.jpg", "b_40_000": "./photos/b_40_000.jpg", "b_41_004": "./photos/b_41_004.jpg", "b_42_006": "./photos/b_42_006.jpg", "b_45_002": "./photos/b_45_002.jpg", "b_46_004": "./photos/b_46_004.jpg", "b_47_000": "./photos/b_47_000.jpg", "b_48_000": "./photos/b_48_000.jpg", "b_50_000": "./photos/b_50_000.jpg", "b_50_002": "./photos/b_50_002.jpg", "b_51_002": "./photos/b_51_002.jpg", "b_53_002": "./photos/b_53_002.jpg", "b_55_000": "./photos/b_55_000.jpg", "b_55_002": "./photos/b_55_002.jpg", "b_56_002": "./photos/b_56_002.jpg", "b_56_004": "./photos/b_56_004.jpg", "b_58_000": "./photos/b_58_000.jpg", "b_58_002": "./photos/b_58_002.jpg", "b_58_006": "./photos/b_58_006.jpg", "u_akabane": "./photos/u_akabane.jpg", "u_stairs": "./photos/u_stairs.jpg", "u_maman": "./photos/u_maman.jpg", "b_60_000": "./photos/b_60_000.jpg", "b_61_000": "./photos/b_61_000.jpg", "b_61_002": "./photos/b_61_002.jpg", "w_meijidori": "./photos/w_meijidori.jpg", "w_shibuya_xmas": "./photos/w_shibuya_xmas.jpg", "b_62_004": "./photos/b_62_004.jpg", "b_62_010": "./photos/b_62_010.jpg", "b_63_000": "./photos/b_63_000.jpg", "b_63_006": "./photos/b_63_006.jpg"};


/* ---------- Scenes（還沒有照片的日子用插畫） ---------- */
function tree(x,y,s){
  const g = `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-5" y="-6" width="10" height="14" fill="#5A3A22"/>
    <path d="M0 -112 L-30 -58 H-14 L-40 -14 H-18 L-48 0 H48 L18 -14 H40 L14 -58 H30 Z" fill="#1F5A40"/>
    <path d="M0 -124 l4 9 10 1-7.5 6.5 2.3 9.5L0 -103l-8.8 5 2.3-9.5L-14 -114l10-1z" fill="#F3D27A"/>
    ${[[-12,-70,'#D8473A'],[10,-52,'#F3D27A'],[-22,-30,'#F3D27A'],[18,-24,'#D8473A'],[-4,-40,'#FFFFFF'],[30,-8,'#F3D27A'],[-32,-6,'#D8473A'],[4,-86,'#D8473A']].map(([a,b,c])=>`<circle cx="${a}" cy="${b}" r="3.6" fill="${c}"/>`).join('')}</g>`;
  return g;
}
function garland(){
  let s = '<path d="M-10 18 Q100 62 200 22 T410 20" fill="none" stroke="#0B1A14" stroke-width="1.6" opacity=".6"/>';
  const cols = ['#D8473A','#F3D27A','#5FA77E','#F3D27A'];
  for (let i=0;i<14;i++){ const t=i/13, x=-10+t*420; const y = t<.5 ? 18+Math.sin(t*2*Math.PI)*0+ (44*Math.sin(t*Math.PI*2*0.5*2)) * (t<.5?1:0) : 0;
    const yy = t<=.5 ? 18 + 40*Math.sin(t*2*Math.PI) : 22 + 18*Math.sin((t-.5)*2*Math.PI);
    s += `<circle cx="${x.toFixed(1)}" cy="${(yy+6).toFixed(1)}" r="4.2" fill="${cols[i%4]}"/><circle cx="${x.toFixed(1)}" cy="${(yy+6).toFixed(1)}" r="9" fill="${cols[i%4]}" opacity=".18"/>`; }
  return s;
}
function snow(){
  let s=''; for(let i=0;i<70;i++){ const x=(i*61)%400, y=(i*97)%300, r=1+((i*7)%3)*.7; s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity="${.45+((i*13)%5)/10}"/>`; } return s;
}
function fireworks(){
  const cols = ['#F3D27A','#FF6B6B','#FFFFFF','#FF9ECF','#8FE3B0','#FFD36E'];
  const bursts = [[20,24,0],[76,18,.8],[50,40,1.6],[86,46,2.4],[28,50,3.1],[62,22,3.8],[40,16,4.5]];
  return `<div class="fw" aria-hidden="true">${bursts.map(([x,y,dl],n) => {
    const c = cols[n % cols.length], r = 56 + (n % 3) * 14;
    const dots = Array.from({length:22}, (_,k) => { const a = k / 22 * Math.PI * 2, rr = k%2 ? r : r*0.62; return `${(Math.cos(a)*rr).toFixed(1)}px ${(Math.sin(a)*rr).toFixed(1)}px 0 ${k%2?2:1.5}px ${k%3?c:'#fff'}`; }).join(',');
    return `<i style="left:${x}%;top:${y}%;animation-delay:${dl}s;box-shadow:${dots};color:${c}"></i>`; }).join('')}</div>`;
}
function fx(){ return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80" preserveAspectRatio="xMidYMin slice">${garland()}</svg>`); }
function scene(kind){
  const sky = {tower:['#3C6B57','#1F4537','#0F2A21'], fuji:['#4E7A83','#24464F','#122A31'], shrine:['#5E2A2C','#3A1E22','#1C1416'], city:['#2F5546','#1B392F','#0D211B'], sea:['#6F8F96','#33545E','#172E36']}[kind] || ['#3C6B57','#1F4537','#0F2A21'];
  let art = '';
  const skyline = (y,col,lit) => { let s=''; const w=[28,40,22,34,46,26,38,30,44,24,36,50,28,40,32,42,26,38]; let x=0; w.forEach((b,i)=>{ const h=30+((i*37)%60); s+=`<rect x="${x}" y="${y-h}" width="${b}" height="${h+40}" fill="${col}"/>`; if(lit){ for(let k=0;k<3;k++) s+=`<rect x="${x+6+(k*9)%(b-10)}" y="${y-h+10+k*14}" width="4" height="6" fill="#F3D27A" opacity=".8"/>`; } x+=b+4; }); return s; };
  if (kind==='tower'){
    art = skyline(250,'#1A3A2E',true) + `<g transform="translate(310 0)"><path d="M0 250 L28 70 L32 30 L36 70 L64 250 Z" fill="#D8473A"/><path d="M12 170h40M20 120h24" stroke="#F3D27A" stroke-width="5"/><rect x="20" y="150" width="24" height="10" fill="#F3D27A"/><path d="M32 30V6" stroke="#D8473A" stroke-width="3"/></g>` + tree(70,300,1) + skyline(300,'#0E241C');
  } else if (kind==='fuji'){
    art = `<g transform="translate(0 86)"><path d="M-10 250 L170 80 Q200 58 230 80 L420 250 Z" fill="#4F7883"/><path d="M170 80 Q200 58 230 80 L258 106 L238 100 L222 112 L204 98 L186 112 L168 100 L146 106 Z" fill="#FFFFFF"/><path d="M-10 250 Q120 220 260 236 T420 228 V320 H-10 Z" fill="#24493B"/><rect x="-10" y="262" width="430" height="60" fill="#2C5560"/><path d="M40 270h60M160 284h80M280 274h70" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>`;
  } else if (kind==='shrine'){
    art = skyline(270,'#2A1518',true) + `<g transform="translate(150 70)"><rect x="-10" y="0" width="120" height="16" rx="6" fill="#16100F"/><rect x="0" y="16" width="100" height="150" fill="#8E1F22"/><ellipse cx="50" cy="110" rx="34" ry="44" fill="#C9302C"/><path d="M22 100h56M22 120h56" stroke="#3B2326" stroke-width="3"/><rect x="38" y="152" width="24" height="10" fill="#3B2326"/></g>`;
  } else if (kind==='city'){
    let win=''; for(let i=0;i<60;i++){ win+=`<rect x="${(i*53)%400}" y="${150+((i*29)%110)}" width="5" height="7" fill="#F8D9A0" opacity=".85"/>`; }
    art = skyline(260,'#10261E') + win + tree(330,300,1.1) + `<g opacity=".8">${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${40+i*42}" y="290" width="24" height="30" fill="#E8E4EF" transform="skewX(-20)"/>`).join('')}</g>`;
  } else if (kind==='sea'){
    art = `<circle cx="300" cy="130" r="34" fill="#F3E2B0"/><path d="M220 250 Q250 170 290 180 Q320 160 350 250 Z" fill="#244A3B"/><rect x="284" y="150" width="6" height="34" fill="#E8E2D6"/><rect x="-10" y="240" width="430" height="80" fill="#2A5361"/><path d="M0 262q20-8 40 0t40 0 40 0M150 280q20-8 40 0t40 0 40 0M60 300q20-8 40 0t40 0" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".7"/>`;
  }
  const svg0 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[2]}"/><stop offset=".55" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[0]}"/></linearGradient></defs><rect width="400" height="320" fill="url(#g)"/>${art}${snow()}${garland()}</svg>`;
  const svg = svg0;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/* ---------- Helpers ---------- */
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
function tokyoNow(){
  const p = {};
  new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
    .formatToParts(new Date()).forEach(x => p[x.type] = x.value);
  return { date:`${p.year}-${p.month}-${p.day}`, time:`${p.hour}:${p.minute}` };
}
const dayNum = s => { const [y,m,d] = s.split('-').map(Number); return Date.UTC(y,m-1,d)/864e5; };
const mapsUrl = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
let toastTimer;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove('show'), 1600); }

/* ---------- State ---------- */
let now = tokyoNow();
const tripIdx = DAYS.findIndex(d => d.date === now.date);
let sel = tripIdx >= 0 ? tripIdx : store.get('tk-day', 0);
if (!(sel >= 0 && sel < DAYS.length)) sel = 0;

/* ---------- Header ---------- */
function renderHeader(){
  now = tokyoNow();
  $('#jst').textContent = now.time; document.querySelectorAll('.jst-x').forEach(e => e.textContent = now.time);
  const diff = dayNum(DAYS[0].date) - dayNum(now.date);
  const after = dayNum(now.date) - dayNum(DAYS[DAYS.length-1].date);
  let html;
  if (diff > 0) html = `<span class="pill">${treeI}還有 <b class="num">${diff}</b> 天出發</span><span>12/29（二）07:55 桃園起飛・聖誕快樂！</span>`;
  else if (after > 0) html = `<span class="pill pine">旅程結束</span><span>下次再來東京！</span>`;
  else { const i = DAYS.findIndex(d => d.date === now.date); html = `<span class="pill gold">DAY ${i+1} / ${DAYS.length}</span><span>今天：${DAYS[i].area}</span>`; }
  $('#status').innerHTML = html;
}

/* ---------- Icons ---------- */
const treeI = '<svg class="mini-tree" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M12 2l3 5h-2l4 6h-2.5l4 6H5.5l4-6H7l4-6H9z" fill="#2F7D52"/><rect x="11" y="19" width="2" height="3" fill="#8B5A2B"/><circle cx="12" cy="2.6" r="1.6" fill="#F3C14E"/></svg>';
const hollyI = '<svg class="holly" viewBox="0 0 40 28" aria-hidden="true"><path d="M20 15C14 4 6 6 2 9c4 1 3 5 7 5-2 3 1 6 4 4 2 3 6 1 7-3z" fill="#2F7D52"/><path d="M20 15c6-11 14-9 18-6-4 1-3 5-7 5 2 3-1 6-4 4-2 3-6 1-7-3z" fill="#3F9466"/><circle cx="17" cy="17" r="3.2" fill="#C8303A"/><circle cx="23" cy="17" r="3.2" fill="#D9404A"/><circle cx="20" cy="12.5" r="3.2" fill="#B3262E"/><circle cx="16" cy="16" r="1" fill="#fff" opacity=".6"/></svg>';
const TILE = {
  plane:'<path d="M2.5 13.5 21 7.5c1-.3 1.6 1 .7 1.6L15 13l-2 7.5-2.2.6.6-6.4-4.8 1.6-1.7 2.3-1.6.4.6-3.2-1.4-2.3z"/>',
  hotel:'<path d="M3 20V10l9-6 9 6v10"/><path d="M9 20v-6h6v6M3 20h18"/>',
  food:'<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5"/>',
  walk:'<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M12 15l-1-5 4 2 2 3M11 10l-3 2-1 3"/>',
  mountain:'<path d="M2 20 9 8l4 6 3-4 6 10z"/><path d="M7.2 11.2 9 12.5l1.6-1.5"/><circle cx="18" cy="5.5" r="2"/>',
  train:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="13.5" r="1"/><circle cx="15" cy="13.5" r="1"/>',
  shop:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  cafe:'<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>',
  shrine:'<path d="M3 6c4 1 14 1 18 0M5 10h14M7 6v14M17 6v14"/>',
  view:'<circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>',
  home:'<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  snow:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"/>'
};
const icon = (k, size=34) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="#B08F7C" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TILE[k] || TILE.walk}</svg>`;
const clockI = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const navI = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 21 3l-8 18-2-8z"/></svg>';

const heroHtml = (kind, sub, script='Tokyo', small=false, photo='', pos='50% 50%', ny=false) => `
    <div class="hero${small?' small':''}${photo?' photo':''}${ny?' ny':''}" style="background-image:url('${photo?PHOTOS[photo]:scene(kind)}');background-position:${pos}">
      ${ny ? fireworks() : (photo?`<div class="hero-fx" style="background-image:url('${fx()}')"></div>`:'')}${sub.includes('倒數')?`<div class="twk" aria-hidden="true">${[[12,30],[28,18],[46,40],[64,14],[80,32],[90,52],[20,52],[56,58]].map(([x,y],n)=>`<i style="left:${x}%;top:${y}%;animation-delay:${(n*0.37).toFixed(2)}s"></i>`).join('')}</div>`:''}
      <div class="hero-top"><span class="hpill hs-x"></span><span class="hpill"><b class="num jst-x">${now.time}</b> 日本時間</span></div>
      <div class="hero-title"><div class="script">${script}</div><div class="hsub">/ ${sub} /</div></div>
    </div>`;
function fillHeroStatus(){ const sp = document.querySelector('#status .pill'); document.querySelectorAll('.hs-x').forEach(e => e.innerHTML = sp ? sp.innerHTML : ''); }

/* ---------- Plan ---------- */
const isTransit = it => it.ic === 'train' || it.ic === 'plane';
function renderPlan(){
  const d = DAYS[sel];
  const isToday = d.date === now.date;
  let nowIdx = -1;
  if (isToday){ d.items.forEach((it,i) => { if (it.t && it.t <= now.time) nowIdx = i; }); }
  const chips = DAYS.map((x,i) => `<button class="dchip${x.date===now.date?' today':''}${x.date==='2026-12-31'?' eve':''}${x.date==='2027-01-01'?' nyd':''}" role="tab" aria-selected="${i===sel}" data-day="${i}">
      <span class="dn">D0${i+1}</span><span class="dd num">${+x.date.slice(8)}</span><span class="dw">${WD[x.wd]}</span></button>`).join('');
  const cards = d.items.map((it,i) => {
    if (it.flight){ const f = FLIGHTS[it.flight];
      return `<div class="fcard"><div class="fc-top"><span>${f.no}</span><span>${f.note}</span></div>
        <div class="fc-mid"><div><b>${f.from[0]} ${f.from[1]}</b><span class="num">${f.from[2]||'時間待補'}</span></div>
        <div class="fc-dur"><span>${f.dur}</span><i></i></div>
        <div class="r"><b>${f.to[0]} ${f.to[1]}</b><span class="num${f.to[2]?'':' tbd'}">${f.to[2]||'抵達待補'}</span></div></div></div>`; }
    const chipsHtml = [
      it.dur ? `<span class="mini">${clockI}${esc(it.dur)}</span>` : '',
      it.food!=null ? `<span class="mini food">${d.food[it.food].list.length} 家選項</span>` : '',
      it.warn ? `<span class="mini warn">待確認</span>` : '',
      it.tips ? `<span class="mini fix">小筆記</span>` : ''
    ].join('');
    const nav = it.q ? `<a class="nv" href="${mapsUrl(it.q)}" target="_blank" rel="noopener" aria-label="Google 地圖導航">${navI}</a>` : '';
    if (isTransit(it)){
      const parts = it.ti.split('→').map(s => s.trim());
      return `<article class="acard tk${i===nowIdx?' now':''}" data-item="${i}" tabindex="0" role="button" aria-label="${esc(it.ti)}">
        <div class="tk-top"><span class="tk-t num">${it.t||''}</span><span class="tk-k">${it.ic==='plane'?'AIRPORT':'TRANSPORT'}</span></div>
        ${parts.length===2 ? `<div class="tk-r"><b>${esc(parts[0])}</b><i></i><b>${esc(parts[1])}</b></div>` : `<div class="tk-r one"><b>${esc(it.ti)}</b></div>`}
        <p>${esc(it.d)}</p>
        <div class="tk-f">${it.dur?`<span>${clockI}${esc(it.dur)}</span>`:'<span></span>'}${it.warn?'<span class="tw">待確認</span>':''}${nav}</div></article>`;
    }
    const img = it.photo && PHOTOS[it.photo];
    return `<article class="acard pc${i===nowIdx?' now':''}" data-item="${i}" tabindex="0" role="button" aria-label="${esc(it.ti)}">
      <div class="pc-img${img?'':' noimg'}"${img?` style="background-image:url('${img}')${it.pos?`;background-position:${it.pos}`:''}"`:''}>${img?'':icon(it.ic,30)}${it.t?`<span class="pc-t num">${it.t}</span>`:''}</div>
      <div class="pc-b"><h3>${esc(it.ti)}</h3><p>${esc(it.d)}</p>
        <div class="pc-f"><span class="pc-meta">${it.dur?`${clockI}${esc(it.dur)}`:''}${it.food!=null?`<em class="fd">${d.food[it.food].list.length} 家選項</em>`:''}${it.warn?'<em class="wn">待確認</em>':''}</span>${nav}</div></div></article>`;
  }).join('');
  const v = $('#v-plan'); v.className = 'view plan';
  v.innerHTML = `
    ${d.date==='2027-01-01' ? heroHtml(d.scene,'2027 元旦・新年快樂','Happy New Year',false,d.photo,d.pos,true) : d.date==='2026-12-31' ? heroHtml(d.scene,'大晦日・一起跨年倒數','Countdown',false,d.photo,d.pos).replace('class="hero ','class="hero eve ') + '' : heroHtml(d.scene,'東京年末自由行','Tokyo',false,d.photo,d.pos)}
    <div class="dchips" role="tablist" aria-label="選擇日期">${chips}</div>
    ${weatherHtml(d)}
    <div class="sech"><h2>Day ${sel+1}：${esc(d.title)}</h2><span>ITINERARY</span></div>
    ${d.note?`<p class="daynote">${esc(d.note)}</p>`:''}
    <div class="cards">${cards}</div>
    <div class="xmas-end">${treeI}<span>${d.date==='2026-12-31'?'今年辛苦了，一起倒數 3、2、1！':d.date==='2027-01-01'?'あけましておめでとう！新年快樂':'Merry Christmas & Happy 2027'}</span>${treeI}</div>`;
  fillHeroStatus();
  const cur = v.querySelector('.dchip[aria-selected="true"]'); if (cur) cur.parentNode.scrollLeft = cur.offsetLeft - (cur.parentNode.clientWidth - cur.offsetWidth) / 2;
}

function openSheet(i){
  const d = DAYS[sel], it = d.items[i]; if (!it || it.flight) return;
  modalKind = ''; $('#sheet').classList.remove('form');
  const fg = it.food!=null ? d.food[it.food] : null;
  const foodHtml = fg ? `<div class="s-sec"><h4>${esc(fg.name)}</h4><ul class="s-food">${fg.list.map(r => `<li><div class="n"><span>${esc(r.n)}</span></div>${r.h?`<div class="h num">${esc(r.h)}</div>`:''}${r.x?`<div class="x">${esc(r.x)}</div>`:''}</li>`).join('')}</ul></div>` : '';
  $('#sheet-body').innerHTML = `
    ${it.photo&&PHOTOS[it.photo]&&!isTransit(it) ? `<div class="s-hero ph" style="background-image:url('${PHOTOS[it.photo]}')${it.pos?`;background-position:${it.pos}`:''}"><span class="s-badge">${icon(it.ic,22)}</span></div>` : `<div class="s-hero noimg">${icon(it.ic,30)}</div>`}
    <div class="s-main">
      <div class="s-title"><h3>${esc(it.ti)}</h3>${it.t?`<span class="s-time num">${it.t}</span>`:''}</div>
      <div class="s-meta">${it.dur?`<span>${clockI}${esc(it.dur)}</span>`:''}<span>${esc(d.area)}</span></div>
      <p class="s-desc">${esc(it.d)}</p>
      ${it.tips?`<ul class="s-tips">${it.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}
      ${it.url?`<a class="s-link" href="${esc(it.url[1])}" target="_blank" rel="noopener">${esc(it.url[0])} ↗</a>`:''}
      ${it.warn?`<div class="flag warn"><b>待確認・${esc(it.warn[0])}</b><br>${esc(it.warn[1])}</div>`:''}
      ${foodHtml}
      ${it.q?`<a class="s-nav" href="${mapsUrl(it.q)}" target="_blank" rel="noopener">${navI}開啟 Google 地圖導航</a>`:''}
    </div>`;
  const sh = $('#sheet'); sh.hidden = false; requestAnimationFrame(() => sh.classList.add('open'));
  document.body.style.overflow = 'hidden'; $('#sheet-close').focus();
}
function closeSheet(){ const sh = $('#sheet'); sh.classList.remove('open'); document.body.style.overflow = ''; const k = modalKind; modalKind = ''; editId = null; setTimeout(() => { sh.hidden = true; sh.classList.remove('form'); }, 220); }

/* ---------- Info ---------- */
function renderInfo(){
  $('#v-info').innerHTML = `
    ${heroHtml('fuji','航班・交通・住宿','Travel Info',true,'d2','50% 40%')}
    <div class="card pass"><div class="ph"><div><span class="cty">TAOYUAN</span><span class="ap">TPE</span></div><span class="plane">✈</span><div style="text-align:right"><span class="cty">TOKYO NARITA</span><span class="ap">NRT</span></div></div>
      <div class="pb"><div><div class="sub">TUE DEC 29</div><div class="tm num">07:55</div></div><div class="dur">去程</div><div class="r"><div class="sub">TUE DEC 29</div><div class="tm num">12:00</div></div>
        <div class="meta"><span class="tag">EVA BR184</span><span class="tag">TPE T2 → NRT T1</span><span class="tag">3H05M</span><span class="tag">託運 23kg × 1・手提 7kg × 1</span></div></div>
    </div>
    <div class="card pass back"><div class="ph"><div><span class="cty">TOKYO NARITA</span><span class="ap">NRT</span></div><span class="plane">✈</span><div style="text-align:right"><span class="cty">TAOYUAN</span><span class="ap">TPE</span></div></div>
      <div class="pb"><div><div class="sub">TUE JAN 05</div><div class="tm num">13:00</div></div><div class="dur">回程</div><div class="r"><div class="sub">TUE JAN 05</div><div class="tm num">16:05</div></div>
        <div class="meta"><span class="tag">EVA BR183</span><span class="tag">NRT T1 → TPE T2</span><span class="tag">4H05M</span><span class="tag">託運 23kg × 1・手提 7kg × 1</span></div></div>
    </div>
    <div class="card"><div class="sec-title"><span>京成 Skyliner</span><small>成田 ⇄ 日暮里</small></div>
      <div>
        <div class="train"><b>去程 130 號</b><span>成田空港 → 日暮里／京成上野</span><span class="tt">13:18 → 14:04</span><small>12/29。京成上野 14:09 到，但飯店在鶯谷，日暮里下車轉山手線比較近。</small></div>
        <div class="train"><b>回程 29 號</b><span>日暮里 → 成田空港</span><span class="tt">10:25 → 11:03</span><small>1/5。京成上野 10:20 始發。</small></div>
      </div>
    </div>
    <div class="card"><div class="sec-title"><span>JR 富士回遊</span><small>12/30 新宿 ⇄ 河口湖</small></div>
      <div>
        <div class="train"><b>去程</b><span>新宿 → 河口湖</span><span class="tt">8:15 前到月台</span><small>班次號碼待補。</small></div>
        <div class="train"><b>回程 44 號</b><span>河口湖 → 新宿</span><span class="tt">16:48 → 18:48</span><small>備案 36 號 14:58 → 16:59。</small></div>
      </div>
      <ul class="plain"><li>去回程的票都要在東京市區 JR 東日本車站先領好，回程票在河口湖領不到</li><li>取票時間 5:00–23:30</li></ul>
      <a class="link" href="https://www.eki-net.com/zh-CHT/jreast-train-reservation/Top/Index" target="_blank" rel="noopener">Eki-net 預約 ↗</a>
    </div>
    <div class="card"><div class="sec-title"><span>住宿</span><small>7 晚</small></div>
      <div><h3>LANDABOUT TOKYO 東京風景酒店</h3>
        <dl class="kv" style="margin-top:6px">
          <dt>日期</dt><dd class="num">12/29 – 1/5・7 晚</dd>
          <dt>地址</dt><dd>東京都台東區根岸 3-4-5</dd>
          <dt>交通</dt><dd>JR 鶯谷站走 3 分、日比谷線入谷站走 5 分</dd>
          <dt>入住</dt><dd class="num">15:00 – 24:00</dd>
          <dt>退房</dt><dd class="num">11:00 前</dd>
          <dt>早餐</dt><dd>自助早餐每人 ¥1,650（沒含早餐的房型另付）</dd>
          <dt>費用</dt><dd class="num">¥107,629・Notion 標「未付款」</dd>
        </dl>
        <div class="row" style="margin-top:8px"><a class="link" href="https://maps.app.goo.gl/LdhnfSzLLTvjrUsf8" target="_blank" rel="noopener">Google 地圖 ↗</a></div></div>
    </div>
    <div class="card"><div class="sec-title"><span>年末年始提醒</span></div>
      <ul class="plain">
        <li>上野動物園 12/29–1/1 休園，1/2 開園第一天會很擠</li>
        <li>12/31 築地市場休市，只有部分店開</li>
        <li>12/31、1/1 百貨和很多店會提早關或公休，餐廳出發前再確認</li>
        <li>元旦神社參拜人潮多，排隊時間抓寬一點</li>
      </ul>
    </div>
    <div class="card"><div class="sec-title"><span>付款方式</span></div>
      <ul class="plain">
        <li>只收現金：創作らぁめん 極や</li>
        <li>不收現金：Chiikawa Park、AFURI 辛紅</li>
        <li>交通 IC 卡（Suica／PASMO）可以搭車、超商、很多店都能用</li>
      </ul>
    </div>
    <div class="card"><div class="sec-title"><span>行動電源規定</span></div>
      <ul class="plain">
        <li>只能放手提行李，禁止託運</li>
        <li>100Wh 以下免申請；100–160Wh 要先向航空公司申請；超過 160Wh 禁止</li>
        <li>機上不能使用、不能充電，出發前再看一下長榮最新規定</li>
      </ul>
    </div>
    <div class="card"><div class="sec-title"><span>緊急電話</span></div>
      <dl class="kv num"><dt>警察</dt><dd>110</dd><dt>救護・火災</dt><dd>119</dd></dl>
    </div>
    <div class="card acct"><div class="sec-title"><span>帳號</span></div>
      <div class="acct-r">${AUTH && AUTH.photoURL ? `<img src="${esc(AUTH.photoURL)}" alt="" referrerpolicy="no-referrer">` : `<span class="acct-av">${esc([...(AUTH && AUTH.displayName || '我')][0])}</span>`}
        <div><b>${esc(AUTH && AUTH.displayName || '')}</b><small>${esc(AUTH && AUTH.email || '')}</small></div></div>
      <div id="crew">${crewHtml()}</div>
      <div class="m-acts"><button class="btn" data-invite>邀請旅伴</button><button class="btn ghost" data-logout>登出</button></div>
      <details class="sw-trip"><summary>旅伴看不到我？用邀請碼換到別的行程</summary>
        <p class="m-hint">如果你不小心自己建了一趟行程，輸入主揪給你的 6 碼邀請碼，就會換到他的行程。</p>
        <form id="sw-join" class="g-join"><input id="sw-code" maxlength="6" placeholder="6 碼邀請碼" autocomplete="off" autocapitalize="characters"><button class="btn" type="submit">換過去</button></form>
      </details>
    </div>
    <div class="card"><div class="sec-title"><span>好用 App</span></div>
      <ul class="plain"><li>乘換案內、Google 地圖：查電車</li><li>Tabelog：查餐廳</li><li>GO：叫計程車</li><li>tenki.jp：天氣</li></ul>
    </div>
`;
}

function crewHtml(){
  const ids = (typeof S !== 'undefined' && S.members) || [];
  const av = id => { const d = MEMBER_DATA[id] || {}, n = d.name || (AUTH && id === AUTH.uid && AUTH.displayName) || '旅伴';
    return `<li>${d.photo ? `<img src="${esc(d.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="acct-av">${esc([...n][0])}</span>`}<span>${esc(n)}${AUTH && id === AUTH.uid ? '<small>（我）</small>' : ''}${TRIP && id === TRIP.ownerId ? '<em>主揪</em>' : ''}</span></li>`; };
  return `<div class="crew"><div class="crew-h">這趟行程的旅伴（${ids.length} 人）<span class="num">邀請碼 ${esc(TRIP ? TRIP.code : '')}</span></div>
    ${ids.length ? `<ul>${ids.map(av).join('')}</ul>` : '<p class="m-hint">讀取中…</p>'}
    ${ids.length === 1 ? '<p class="m-hint">目前只有你。旅伴要從邀請連結登入，或在「資訊」頁輸入上面的邀請碼，才會出現在這裡。</p>' : ''}</div>`;
}
const renderCrew = () => { const c = document.getElementById('crew'); if (c) c.innerHTML = crewHtml(); };

/* ---------- 天氣：Open-Meteo 預報（約 16 天內），還沒到就顯示往年平均 ---------- */
const WX_LOC = { tokyo:[35.6812,139.7671], fuji:[35.4983,138.7690] };
const wxLoc = d => d.scene === 'fuji' ? 'fuji' : 'tokyo';
let WX = (() => { try { return JSON.parse(localStorage.getItem('tk-wx') || 'null') || {}; } catch(e){ return {}; } })();
const WMO = c => c === 0 ? ['☀️','晴'] : c <= 2 ? ['🌤️','晴時多雲'] : c === 3 ? ['☁️','陰'] : c <= 48 ? ['🌫️','有霧']
  : c <= 57 ? ['🌦️','毛毛雨'] : c <= 67 ? ['🌧️','下雨'] : c <= 77 ? ['❄️','下雪'] : c <= 82 ? ['🌧️','陣雨'] : c <= 86 ? ['🌨️','陣雪'] : ['⛈️','雷雨'];
function weatherHtml(d){
  const f = WX[wxLoc(d)] && WX[wxLoc(d)].days && WX[wxLoc(d)].days[d.date];
  if (f){
    const [em, lab] = WMO(f.c), cold = f.lo <= 0 ? '・會到 0 度以下，暖暖包帶好' : '';
    const rain = f.p != null && f.p >= 30 ? `・降雨機率 ${f.p}%，帶傘` : (f.p != null ? `・降雨機率 ${f.p}%` : '');
    return `<div class="wcard">${hollyI}<div class="w-ic w-em">${em}</div>
      <div class="w-tx"><b>${esc(d.area)}　<span class="num">${Math.round(f.hi)}°C / ${Math.round(f.lo)}°C</span></b><span>${lab}${rain}${cold}</span></div>
      <span class="w-tag live">預報</span></div>`;
  }
  return `<div class="wcard">${hollyI}<div class="w-ic">${icon('snow',24)}</div>
      <div class="w-tx"><b>${esc(d.area)}　<span class="num">${d.cl[0]}°C / ${d.cl[1]}°C</span></b><span>出發前約兩週自動換成真的預報</span></div>
      <span class="w-tag">往年平均</span></div>`;
}
async function loadWeather(){
  const now = Date.now(), last = DAYS[DAYS.length - 1].date;
  if (new Date(last + 'T23:59:00+09:00').getTime() < now) return;           // 旅行結束就不抓了
  if (new Date(DAYS[0].date + 'T00:00:00+09:00').getTime() - now > 17 * 864e5) return; // 還太早，預報抓不到
  let changed = false;
  await Promise.all(Object.entries(WX_LOC).map(async ([k, [la, lo]]) => {
    if (WX[k] && now - WX[k].at < 3 * 3600e3) return;                         // 3 小時內抓過就用快取
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=16`);
      if (!r.ok) return; const j = await r.json(), dd = j.daily || {}, days = {};
      (dd.time || []).forEach((t, i) => { if (dd.temperature_2m_max[i] != null) days[t] = { hi: dd.temperature_2m_max[i], lo: dd.temperature_2m_min[i], c: dd.weather_code[i], p: dd.precipitation_probability_max ? dd.precipitation_probability_max[i] : null }; });
      WX[k] = { at: now, days }; changed = true;
    } catch(e){}
  }));
  if (changed){ try { localStorage.setItem('tk-wx', JSON.stringify(WX)); } catch(e){} renderPlan(); fillHeroStatus(); }
}

/* ---------- Shared data：記帳 + 購物清單（大家一起改） ---------- */
let DB = null, USER = null, canWrite = true, isOwner = false;
const S = {exp:[], shop:[], mates:[], members:[], rate:0, ok:{exp:false, shop:false, set:false}, state:'loading'};
const inviteUrl = () => `${location.origin}${location.pathname}#join-${TRIP.code}`;
const DEFAULT_RATE = 0.21;
const RATE = () => S.rate > 0 ? S.rate : DEFAULT_RATE;
const METHODS = [['cash','現金'],['credit','信用卡']];
const NAMES = {}; let MY_ID = null;
const mates = () => [...new Set([...S.members.map(id => 'u:' + id), ...S.mates])];
const nm = k => k && k.startsWith('u:') ? (k.slice(2) === MY_ID ? (NAMES[MY_ID] || '我') : (NAMES[k.slice(2)] || '旅伴')) : (k || '');
const WP_TONES = [['#FFE4EA','#F48FA6','#C2456A'],['#E2F3E9','#7CCB9C','#2F7D52'],['#FFF1CC','#F2C14E','#9A6B00'],['#E8E6FF','#A59BF2','#5A4FC2'],['#DFF1FB','#7CC4EA','#2B7BA6']];
const splitOf = (e, people) => { const sp = Array.isArray(e.split) && e.split.length ? e.split : (e.share === false ? [e.payer] : people); return sp.filter(m => people.includes(m)); };
function splitTag(e){
  const people = [...new Set([...mates(), ...S.exp.map(x => x.payer).filter(Boolean)])], sp = splitOf(e, people);
  if (sp.length <= 1 && sp[0] === e.payer) return '<em class="ml-own">不分帳</em>';
  if (sp.length >= people.length) return '<em class="ml-sh">平分</em>';
  return `<em class="ml-sh part">${sp.length} 人分</em>`;
}
function settle(people){
  const bal = {}, owe = {}; people.forEach(p => { bal[p] = 0; owe[p] = 0; });
  let shared = 0;
  S.exp.forEach(e => { if (!people.includes(e.payer)) return; const sp = splitOf(e, people); if (!sp.length || (sp.length === 1 && sp[0] === e.payer)) return;
    const a = +e.amount || 0; shared += a; bal[e.payer] += a; sp.forEach(m => { bal[m] -= a / sp.length; owe[m] += a / sp.length; }); });
  const deb = [], cred = []; Object.entries(bal).forEach(([m,v]) => { if (v < -0.5) deb.push([m,-v]); else if (v > 0.5) cred.push([m,v]); });
  deb.sort((a,b) => b[1]-a[1]); cred.sort((a,b) => b[1]-a[1]);
  const tx = []; let i = 0, j = 0;
  while (i < deb.length && j < cred.length){ const x = Math.min(deb[i][1], cred[j][1]); tx.push([deb[i][0], cred[j][0], x]); deb[i][1] -= x; cred[j][1] -= x; if (deb[i][1] < 0.5) i++; if (cred[j][1] < 0.5) j++; }
  return {shared, owe, tx};
}
const giftI = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2" fill="#C8303A"/><rect x="2" y="6.5" width="20" height="4" rx="1.5" fill="#D9404A"/><rect x="10.8" y="6.5" width="2.4" height="14.5" fill="#F3D27A"/><path d="M12 6.5c-1.5-3.5-5-4-5-1.5 0 1.6 2.6 1.5 5 1.5zm0 0c1.5-3.5 5-4 5-1.5 0 1.6-2.6 1.5-5 1.5z" fill="#F3D27A"/></svg>';
const crownI = '<svg viewBox="0 0 24 24" width="24" height="24" fill="#F3C14E" stroke="#B8860B" stroke-width="1.2" stroke-linejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z"/></svg>';
const mLabel = m => (METHODS.find(x => x[0] === m) || [0,'未填'])[1];
const yen = n => '¥' + Math.round(n).toLocaleString('en-US');
const twd = n => 'NT$' + Math.round(n * RATE()).toLocaleString('en-US');
const dayLabel = ds => { const i = DAYS.findIndex(d => d.date === ds); return i < 0 ? (ds || '') : `${+ds.slice(5,7)}/${+ds.slice(8)}（${WD[DAYS[i].wd]}）`; };
const tripToday = () => DAYS.some(d => d.date === now.date) ? now.date : '';
let editId = null, delArm = null, shopEdit = null;
let mView = store.get('tk-cur', 'TWD'), mFilter = 'all', pFilter = 'all';
const F = {item:'', amount:'', cur:'JPY', payer: store.get('tk-payer',''), method: store.get('tk-method','cash'), date:'', addingMate:false, split: null};

const cashI = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>';
const cardI = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/></svg>';
const peopleI = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M21 20c0-2.8-1.7-5-4-5.7"/></svg>';

function noteHtml(){
  if (S.state === 'off') return `<p class="daynote">要先用 Google 登入才能記帳和編輯購物清單。</p>`;
  if (S.state === 'err') return `<p class="daynote">資料暫時讀不到，晚點再打開看看。</p>`;
  if (S.state === 'stale') return `<p class="daynote">還在連線，資料可能不是最新的。</p>`;
  if (!canWrite) return `<p class="daynote">你目前沒辦法修改，請重新整理或重新登入看看。</p>`;
  return '';
}
const can = () => !!DB && canWrite;
function writeFail(e){
  if (e && e.code === 'invalid_argument'){ canWrite = false; toast('你目前只能看，不能修改'); }
  else if (e && e.code === 'quota_exceeded') toast('資料已滿，刪掉一些再試');
  else toast('沒有存成功，請確認網路後再試一次');
  renderMoney(); renderShop();
}
async function initDb(){
  DB = TRIP ? tripDB(TRIP.id) : null;
  USER = {
    id: async () => AUTH ? AUTH.uid : null,
    isOwner: async () => !!(AUTH && TRIP && TRIP.ownerId === AUTH.uid),
    can: async () => true,
    profiles: async (ids) => Object.fromEntries(ids.map(i => [i, {name: (MEMBER_DATA[i] && MEMBER_DATA[i].name) || ''}]))
  };
  try { isOwner = USER && USER.isOwner ? !!(await USER.isOwner()) : false; } catch(e){}
  if (isOwner && !store.get('tk-invited', false)) setTimeout(() => openInvite(true), 600);
  if (!DB){ S.state = 'off'; renderMoney(); renderShop(); return; }
  try { const c = USER && USER.can ? await USER.can('data.write') : null; if (c === false) canWrite = false; } catch(e){}
  const timer = setTimeout(() => { if (S.state === 'loading'){ S.state = 'stale'; renderMoney(); renderShop(); } }, 10000);
  const got = (k, snap) => { if (!snap.metadata.fromCache) S.ok[k] = true; if (S.ok.exp && S.ok.shop && S.ok.set && S.state !== 'ready'){ clearTimeout(timer); S.state = 'ready'; renderMoney(); renderShop(); } };
  const fail = () => { clearTimeout(timer); S.state = 'err'; renderMoney(); renderShop(); };
  DB.collection('expenses').orderBy('createdAt','desc').onSnapshot(s => {
    S.exp = s.docs.map(d => ({id:d.id, ...d.data()})).filter(e => typeof e.title === 'string' && isFinite(+e.amount));
    got('exp', s); renderMoney(); }, fail);
  try { MY_ID = USER && USER.id ? await USER.id() : null; } catch(e){ MY_ID = null; }
  if (MY_ID && canWrite){ try { const me = await DB.doc('members/' + MY_ID).get(); if (!me.exists) await DB.doc('members/' + MY_ID).set({joinedAt: Date.now()}); } catch(e){} }
  DB.collection('members').onSnapshot(async s => {
    s.docs.forEach(d => { MEMBER_DATA[d.id] = d.data() || {}; });
    S.members = s.docs.map(d => d.id).filter(id => /^[\w.:@+~-]+$/.test(id));
    try { if (USER && USER.profiles && S.members.length){ const ps = await USER.profiles(S.members); S.members.forEach(id => { const n = ps && ps[id] && ps[id].name; if (n) NAMES[id] = n; }); } } catch(e){}
    renderMoney(); renderCrew(); if (modalKind === 'exp') renderExpModal(); }, e => console.warn('members', e));
  DB.collection('shop').orderBy('createdAt','asc').onSnapshot(s => {
    S.shop = s.docs.map(d => ({id:d.id, ...d.data()})).filter(x => typeof x.text === 'string');
    got('shop', s); renderShop(); }, fail);
  DB.doc('trip/settings').onSnapshot(s => {
    const d = s.exists ? s.data() : {};
    S.mates = Array.isArray(d.mates) ? d.mates.filter(x => typeof x === 'string' && x.trim()).slice(0, 12) : [];
    S.rate = +d.rate > 0 ? +d.rate : 0;
    got('set', s); renderMoney(); if (modalKind === 'exp') renderExpModal(); }, fail);
}
const saveSettings = (mates, rate) => DB.doc('trip/settings').set({mates, rate}).catch(writeFail);

/* ---- 記帳頁（參考 FUK 的旅費管理） ---- */
function renderMoney(){
  const v = $('#v-money'); if (!v) return;
  const sum = arr => arr.reduce((s,e) => s + (+e.amount||0), 0);
  const total = sum(S.exp);
  const cash = sum(S.exp.filter(e => e.method === 'cash')), credit = sum(S.exp.filter(e => e.method === 'credit'));
  const big = n => mView === 'TWD' ? twd(n) : yen(n);
  const small = n => mView === 'TWD' ? yen(n) : twd(n);
  const people = [...new Set([...mates(), ...S.exp.map(e => e.payer).filter(Boolean)])];
  if (pFilter !== 'all' && !people.includes(pFilter)) pFilter = 'all';
  const list = S.exp.filter(e => (mFilter === 'all' || e.method === mFilter) && (pFilter === 'all' || e.payer === pFilter));
  const groups = {}; list.forEach(e => { (groups[e.date || ''] = groups[e.date || ''] || []).push(e); });
  const dates = Object.keys(groups).sort().reverse();
  v.innerHTML = `
    <div class="mh">
      <h2>旅費管理</h2>
      <div class="mh-r"><button class="mh-pill" data-rate>1 JPY = ${RATE()} TWD</button>
        <button class="mh-pill inv" data-invite>${peopleI}邀請旅伴</button></div>
    </div>
    ${noteHtml()}
    <div class="mt">${hollyI}
      <button class="mt-cur" data-cur>切換幣別（${mView}）</button>
      <div class="mt-lab">總支出（${mView}）</div>
      <div class="mt-big num">${big(total)}</div>
      <div class="mt-sub num">${mView==='TWD'?'日幣總計 ':'台幣總計 '}${small(total)}</div>
      <div class="mt-split">
        <div><span><i class="dot g"></i>現金</span><b class="num">${big(cash)}</b><small class="num">${small(cash)}</small></div>
        <div><span><i class="dot r"></i>信用卡</span><b class="num">${big(credit)}</b><small class="num">${small(credit)}</small></div>
      </div>
    </div>
    <div class="card wp"><div class="sec-title"><span>誰付了多少</span><small>${mView}</small></div>
      ${people.length ? (() => { const tots = people.map(p => sum(S.exp.filter(e => e.payer === p))); const top = Math.max(...tots);
        const cols = people.length <= 3 ? people.length : (people.length === 4 ? 2 : 3);
        return `<div class="wp-g" style="--cols:${cols}" data-cols="${cols}">${people.map((p,n) => { const mine = S.exp.filter(e => e.payer === p), t = tots[n], tone = WP_TONES[n % WP_TONES.length];
        return `<div class="wp-c" style="--wb:${tone[0]};--wa:${tone[1]};--wi:${tone[2]}">
          <div class="wp-av">${esc([...nm(p)][0]||'?')}${t>0&&t===top&&people.length>1?`<span class="wp-crown">${crownI}</span>`:''}</div>
          <b class="wp-nm">${esc(nm(p))}</b>
          <div class="wp-amt num">${big(t)}</div>
          <div class="wp-bar"><i style="width:${total?Math.max(6,t/total*100).toFixed(1):0}%"></i></div>
          <div class="wp-pills"><span class="num">${cashI}${big(sum(mine.filter(e => e.method==='cash')))}</span><span class="num">${cardI}${big(sum(mine.filter(e => e.method==='credit')))}</span></div>
          <small class="wp-pct num">${total?Math.round(t/total*100):0}%・${mine.length} 筆</small></div>`; }).join('')}</div>`; })()
        : '<p class="m-empty">按「＋ 記一筆」，第一次會請你輸入付款人名字。</p>'}
    </div>
    ${(() => { const st = settle(people); if (people.length < 2) return '';
      return `<div class="card st"><div class="sec-title"><span>分帳結算</span><small>不分帳的不算</small></div>
        <div class="st-sum num">共同支出 ${big(st.shared)}・${people.map(p => `${esc(nm(p))} 分攤 ${big(st.owe[p])}`).join('・')}</div>
        ${st.tx.length ? `<ul class="st-tx">${st.tx.map(([a,b,x]) => `<li><span class="st-p">${esc(nm(a))}</span><span class="st-arrow"><i></i>${giftI}</span><span class="st-p">${esc(nm(b))}</span><b class="num">${big(x)}</b></li>`).join('')}</ul>`
          : `<p class="m-empty">${st.shared ? '目前大家剛好打平，聖誕快樂！' : '還沒有要平分的帳。'}</p>`}
      </div>`; })()}
    <div class="mb"><h3>支出明細</h3><button class="btn" data-add${can()?'':' disabled'}>${PLUS}記一筆</button></div>
    <div class="seg">${[['all','全部'],...METHODS].map(([k,l]) => `<button class="${mFilter===k?'on':''}" data-mf="${k}">${l}</button>`).join('')}</div>
    ${people.length > 1 ? `<div class="pf">${[['all','所有人'],...people.map(p => [p,nm(p)])].map(([k,l]) => `<button class="chip2 sm${pFilter===k?' on':''}" data-pf="${esc(k)}">${esc(l)}</button>`).join('')}</div>` : ''}
    <div class="ml">${dates.length ? dates.map(ds => `<div class="ml-d">${esc(dayLabel(ds))}<span class="num">${yen(sum(groups[ds]))}</span></div>
      ${groups[ds].map(e => `<button class="ml-i" data-exp="${esc(e.id)}">
        <span class="ml-ic ${e.method==='credit'?'r':'g'}">${e.method==='credit'?cardI:cashI}</span>
        <span class="ml-t"><b>${esc(e.title)}</b><small>${splitTag(e)}${esc(nm(e.payer)||'—')}・${mLabel(e.method)}${e.cur==='TWD'?`・原價 NT$${Math.round(+e.orig||0).toLocaleString('en-US')}`:''}</small></span>
        <span class="ml-a"><b class="num">${yen(+e.amount||0)}</b><small class="num">${twd(+e.amount||0)}</small></span></button>`).join('')}`).join('')
      : `<div class="ml-empty">${S.state==='loading'?'讀取中…':(S.exp.length?'沒有符合的支出':'還沒有支出紀錄，按「＋ 記一筆」開始旅程第一筆！')}</div>`}</div>`;
}

/* ---- 共用彈出視窗 ---- */
let modalKind = '';
function openModal(kind, html){
  modalKind = kind;
  $('#sheet-body').innerHTML = html;
  const sh = $('#sheet'); sh.hidden = false; sh.classList.add('form'); requestAnimationFrame(() => sh.classList.add('open'));
  document.body.style.overflow = 'hidden';
}
function readExp(){
  if (!$('#e-item')) return;
  F.item = $('#e-item').value; F.amount = $('#e-amt').value; F.date = $('#e-date').value;
  if ($('#e-mate')) F.newMate = $('#e-mate').value;
}
function renderExpModal(){
  if (modalKind !== 'exp') return;
  readExp();
  const e = editId ? S.exp.find(x => x.id === editId) : null;
  if (!F.date || !DAYS.some(d => d.date === F.date)) F.date = tripToday() || DAYS[sel].date;
  if (!mates().includes(F.payer)) F.payer = (MY_ID && mates().includes('u:' + MY_ID)) ? 'u:' + MY_ID : (mates()[0] || '');
  if (!mates().length) F.addingMate = true;
  const conv = F.cur === 'TWD' && +F.amount > 0 ? `≈ ${yen(+F.amount / RATE())}` : (F.cur === 'JPY' && +F.amount > 0 ? `≈ ${twd(+F.amount)}` : '');
  $('#sheet-body').innerHTML = `<form id="e-f" class="mf" autocomplete="off">
    <h3>${hollyI}${e?'修改支出':'新增支出'}</h3>
    <label class="mf-l">品項<input id="e-item" maxlength="40" placeholder="例如：拉麵" value="${esc(F.item)}"></label>
    <label class="mf-l">金額<span class="mf-amt"><input id="e-amt" inputmode="decimal" placeholder="0" value="${esc(F.amount)}"><em class="num" id="e-conv">${conv}</em></span></label>
    <div class="mf-l">幣別<div class="seg sm">${['JPY','TWD'].map(c => `<button type="button" class="${F.cur===c?'on':''}" data-ecur="${c}">${c}</button>`).join('')}</div></div>
    <div class="mf-l">付款人<div class="chips">${mates().map(m => `<button type="button" class="chip2${m===F.payer?' on':''}" data-epayer="${esc(m)}">${esc(nm(m))}</button>`).join('')}
      ${F.addingMate ? `<span class="m-addmate"><input id="e-mate" maxlength="12" placeholder="${mates().length?'名字':'輸入付款人名字'}" value="${esc(F.newMate||'')}">${S.mates.length?'<button type="button" class="chip2 on" data-emate-ok>加入</button>':''}</span>`
        : `<button type="button" class="chip2 add" data-emate-add>${PLUS}新增</button>`}</div></div>
    ${mates().length > 1 ? (() => { const sp = (F.split || mates()).filter(m => mates().includes(m)); const n = sp.length, raw = +String(F.amount).replace(/[^\d.]/g,'');
      const each = n && raw > 0 ? (F.cur === 'TWD' ? raw / RATE() : raw) / n : 0;
      return `<div class="mf-l"><span class="mf-row">分給誰<span class="mf-quick"><button type="button" data-esplit="all">全部</button><button type="button" data-esplit="me">只有付款人</button></span></span>
      <div class="chips">${mates().map(m => `<button type="button" class="chip2 sp${sp.includes(m)?' on':''}" data-esplit-m="${esc(m)}">${sp.includes(m)?'✓ ':''}${esc(nm(m))}</button>`).join('')}</div>
      <small class="mf-hint">${n<=1 && sp[0]===F.payer ? '不分帳，只算在付款人自己身上' : n ? `${n} 人分${each?`，每人約 ${yen(each)}`:''}` : '至少選一個人'}</small></div>`; })() : ''}
    <div class="mf-l">支付方式<div class="mf-two">${METHODS.map(([k,l]) => `<button type="button" class="mf-m${F.method===k?' on':''}" data-emethod="${k}">${k==='credit'?cardI:cashI}${l}</button>`).join('')}</div></div>
    <div class="mf-l">日期<input type="hidden" id="e-date" value="${F.date}"><div class="dscroll">${DAYS.map(d => `<button type="button" class="dpick${d.date===F.date?' on':''}" data-edate="${d.date}"><span class="num">${+d.date.slice(5,7)}/${+d.date.slice(8)}</span><small>${WD[d.wd]}</small></button>`).join('')}</div></div>
    <div class="mf-b"><button type="button" class="btn ghost" data-close>取消</button><button type="submit" class="btn">${e?'儲存':'確認新增'}</button></div>
    ${e?`<button type="button" class="mf-del" data-edel="${esc(e.id)}">${delArm===e.id?'再按一次刪除':'刪除這筆'}</button>`:''}
  </form>`;
  if (F.addingMate && mates().length && $('#e-mate')) $('#e-mate').focus();
  const on = document.querySelector('.dpick.on'); if (on) on.parentNode.scrollLeft = on.offsetLeft - 40;
}
function openExp(id){
  editId = id || null; delArm = null; F.addingMate = false; F.newMate = '';
  const e = id ? S.exp.find(x => x.id === id) : null;
  if (e) Object.assign(F, {item:e.title, amount: e.cur==='TWD' ? String(e.orig||'') : String(e.amount), cur: e.cur==='TWD'?'TWD':'JPY', payer:e.payer||F.payer, method:e.method||'cash', date:e.date||'', split: Array.isArray(e.split) ? [...e.split] : (e.share === false ? [e.payer] : null)});
  else Object.assign(F, {item:'', amount:'', cur:'JPY', date:'', split: null});
  openModal('exp', ''); renderExpModal();
  if (!e) setTimeout(() => $('#e-item') && $('#e-item').focus(), 250);
}
function openRate(){
  openModal('rate', `<form id="r-f" class="mf"><h3>匯率</h3>
    <label class="mf-l">1 日幣 = 多少台幣<input id="r-v" inputmode="decimal" value="${RATE()}"></label>
    <p class="m-hint">預設 ${DEFAULT_RATE}。換錢的時候照實際匯率改，大家看到的都會一起更新。</p>
    <div class="mf-b"><button type="button" class="btn ghost" data-close>取消</button><button type="submit" class="btn">儲存</button></div></form>`);
}
function openInvite(first){
  store.set('tk-invited', true);
  openModal('invite', `<div class="mf inv-m"><h3>${hollyI}${first?'邀請旅伴一起用':'邀請旅伴'}</h3>
    <p class="m-hint" style="font-size:14px">旅伴打開邀請連結、用 Google 登入，就會自動加入這趟行程，一起看行程、記帳、改購物清單。</p>
    <ol class="inv-s">
      <li>按下面的「複製邀請連結」。</li>
      <li>用 LINE 或訊息傳給旅伴。</li>
      <li>對方打開連結、按「用 Google 登入」，就加入了；名字會自動出現在付款人裡。</li>
    </ol>
    <div class="inv-url"><span>${inviteUrl()}</span><button type="button" class="btn" data-copy-url>複製邀請連結</button></div>
    <p class="m-hint">邀請碼：<b class="num" style="letter-spacing:.15em;color:var(--terra)">${TRIP.code}</b>。也可以在登入畫面輸入這 6 碼加入。</p>
    <div class="mf-b"><button type="button" class="btn ghost" data-close>知道了</button></div></div>`);
}
async function addMateFromModal(){
  readExp();
  const n = (F.newMate || '').trim(); F.addingMate = false; F.newMate = '';
  if (n && !mates().includes(n) && S.mates.length < 12){ F.payer = n; store.set('tk-payer', n); S.mates = [...S.mates, n]; await saveSettings(S.mates, S.rate); }
  renderExpModal();
}

const PLUS = '<svg class="plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>';
/* ---- 購物清單（共用、一般清單） ---- */
function renderShop(){
  const box = $('#v-list'); if (!box) return;
  let keepVal = null;
  if (shopEdit && $('#se-' + shopEdit)) keepVal = $('#se-' + shopEdit).value;
  const addVal = $('#f-shop') ? $('#f-shop').value : '';
  const hadFocus = document.activeElement && document.activeElement.id === 'f-shop';
  const openDone = $('#sh-done') ? $('#sh-done').open : false;
  const dis = can() ? '' : ' disabled';
  const todo = S.shop.filter(x => !x.done), done = S.shop.filter(x => x.done);
  const row = x => `<li class="sh-i${x.done?' is-done':''}">
      <button class="sh-c" data-shop="${esc(x.id)}" aria-label="${x.done?'改回未買':'標記已買'}"${dis}></button>
      ${shopEdit===x.id ? `<input class="sh-e" id="se-${esc(x.id)}" data-shop-edit="${esc(x.id)}" maxlength="60" value="${esc(keepVal!=null?keepVal:x.text)}">`
        : `<button class="sh-t" data-shop-open="${esc(x.id)}"${dis}>${esc(x.text)}</button>`}
      <button class="sh-x" data-shop-del="${esc(x.id)}" aria-label="刪除 ${esc(x.text)}"${dis}>${delArm===x.id?'刪？':'✕'}</button></li>`;
  box.innerHTML = `
    ${heroHtml('city','購物清單・大家一起','Shopping',true,'d6')}
    ${noteHtml()}
    <div class="card sh-card">${hollyI}
      <form id="m-shop" class="sh-add"><input id="f-shop" maxlength="60" placeholder="新增想買的東西" value="${esc(addVal)}"${dis}><button class="sh-plus" type="submit" aria-label="新增"${dis}>${PLUS}</button></form>
      ${todo.length ? `<ul class="sh-list">${todo.map(row).join('')}</ul>` : `<p class="m-empty">${S.state==='loading'?'讀取中…':(done.length?'都買齊了，聖誕快樂！':'清單是空的，把想買的加進來，當作送自己的聖誕禮物！')}</p>`}
      ${done.length ? `<details class="sh-done" id="sh-done"${openDone?' open':''}><summary>已買 ${done.length} 項</summary><ul class="sh-list">${done.map(row).join('')}</ul>
        <button class="btn ghost sm" data-shop-clear${dis}>${delArm==='__clear'?'再按一次清除':'清除已買'}</button></details>` : ''}
    </div>
    <p class="m-hint" style="padding:0 4px">點品名可以改字，✕ 按兩次刪除。大家改的都會同步。</p>`;
  if (shopEdit && $('#se-' + shopEdit)){ const el = $('#se-' + shopEdit); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  else if (hadFocus && $('#f-shop')) $('#f-shop').focus();
  fillHeroStatus();
}
function arm(id, after){ delArm = id; clearTimeout(arm.t); arm.t = setTimeout(() => { delArm = null; after(); }, 3000); }
async function saveShopEdit(id){
  const el = $('#se-' + id); if (!el){ shopEdit = null; return; }
  const t = el.value.trim(); const x = S.shop.find(s => s.id === id); shopEdit = null;
  if (t && x && t !== x.text) await DB.collection('shop').doc(id).update({text:t}).catch(writeFail);
  renderShop();
}
document.addEventListener('submit', async e => {
  const f = e.target; if (!['e-f','r-f','m-shop'].includes(f.id)) return;
  e.preventDefault(); if (!can()) return;
  if (f.id === 'e-f'){
    readExp();
    const raw = +String(F.amount).replace(/[^\d.]/g,'');
    if (!(raw > 0)){ toast('先輸入金額'); $('#e-amt').focus(); return; }
    const typed = (F.newMate || '').trim();
    if (F.addingMate && typed){
      if (!mates().includes(typed)){ S.mates = [...S.mates, typed].slice(0, 12); await saveSettings(S.mates, S.rate); }
      F.payer = typed; store.set('tk-payer', typed); F.addingMate = false; F.newMate = '';
    }
    if (!F.payer){ toast('先輸入付款人名字'); if ($('#e-mate')) $('#e-mate').focus(); return; }
    const amount = Math.round(F.cur === 'TWD' ? raw / RATE() : raw);
    const body = {title: F.item.trim() || '未命名', amount, cur: F.cur, orig: F.cur === 'TWD' ? raw : amount, payer: F.payer, method: F.method, date: F.date, split: F.split ? F.split.filter(m => mates().includes(m)) : null, share: !(F.split && F.split.length === 1 && F.split[0] === F.payer)};
    if (F.split && !body.split.length){ toast('分給誰至少選一個人'); return; }
    const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      if (editId){ await DB.collection('expenses').doc(editId).update(body); toast('已更新'); }
      else { const by = USER && USER.id ? (await USER.id()) || '' : ''; await DB.collection('expenses').add({...body, by, createdAt: Date.now()}); toast('記下 ' + yen(amount) + ' ✦'); }
      editId = null; closeSheet();
    } catch(err){ btn.disabled = false; writeFail(err); }
  } else if (f.id === 'r-f'){
    const r = +String($('#r-v').value).replace(/[^\d.]/g,'');
    if (!(r > 0 && r < 10)){ toast('匯率要填數字，例如 0.21'); return; }
    await saveSettings(S.mates, r); toast('匯率已更新'); closeSheet();
  } else if (f.id === 'm-shop'){
    const t = $('#f-shop').value.trim(); if (!t) return;
    $('#f-shop').value = '';
    try { await DB.collection('shop').add({text:t, done:false, createdAt: Date.now()}); } catch(err){ writeFail(err); }
  }
});
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('[data-add]')){ if (can()) openExp(); return; }
  if (t.closest('[data-rate]')){ if (can()) openRate(); else toast('目前匯率 ' + RATE()); return; }
  if (t.closest('[data-invite]')){ openInvite(false); return; }
  if (t.closest('[data-logout]')){ logOut().then(() => location.reload()); return; }
  if (t.closest('[data-copy-url]')){ try { await navigator.clipboard.writeText(inviteUrl()); toast('已複製邀請連結'); } catch(err){ toast('請長按連結複製'); } return; }
  if (t.closest('[data-cur]')){ mView = mView === 'TWD' ? 'JPY' : 'TWD'; store.set('tk-cur', mView); renderMoney(); return; }
  const mf = t.closest('[data-mf]'); if (mf){ mFilter = mf.dataset.mf; renderMoney(); return; }
  const pf = t.closest('[data-pf]'); if (pf){ pFilter = pf.dataset.pf; renderMoney(); return; }
  const ex = t.closest('[data-exp]'); if (ex){ if (can()) openExp(ex.dataset.exp); return; }
  const edt = t.closest('[data-edate]'); if (edt){ readExp(); F.date = edt.dataset.edate; if ($('#e-date')) $('#e-date').value = F.date; renderExpModal(); return; }
  const ec = t.closest('[data-ecur]'); if (ec){ readExp(); F.cur = ec.dataset.ecur; renderExpModal(); return; }
  const ep = t.closest('[data-epayer]'); if (ep){ readExp(); F.payer = ep.dataset.epayer; store.set('tk-payer', F.payer); renderExpModal(); return; }
  const sq = t.closest('[data-esplit]'); if (sq){ readExp(); F.split = sq.dataset.esplit === 'all' ? null : [F.payer]; renderExpModal(); return; }
  const sm = t.closest('[data-esplit-m]'); if (sm){ readExp(); const m = sm.dataset.esplitM; let sp = (F.split || mates()).filter(x => mates().includes(x)); sp = sp.includes(m) ? sp.filter(x => x !== m) : [...sp, m]; F.split = sp.length === mates().length ? null : sp; renderExpModal(); return; }
  const em = t.closest('[data-emethod]'); if (em){ readExp(); F.method = em.dataset.emethod; store.set('tk-method', F.method); renderExpModal(); return; }
  if (t.closest('[data-emate-add]')){ readExp(); F.addingMate = true; renderExpModal(); return; }
  if (t.closest('[data-emate-ok]')){ await addMateFromModal(); return; }
  const ed = t.closest('[data-edel]'); if (ed && can()){ const id = ed.dataset.edel;
    if (delArm !== id){ readExp(); arm(id, renderExpModal); renderExpModal(); return; }
    delArm = null; editId = null; try { await DB.collection('expenses').doc(id).delete(); toast('已刪除'); closeSheet(); } catch(err){ writeFail(err); } return; }
  const sc = t.closest('[data-shop]'); if (sc && can()){ const x = S.shop.find(s => s.id === sc.dataset.shop); if (!x) return;
    try { await DB.collection('shop').doc(x.id).update({done: !x.done}); } catch(err){ writeFail(err); } return; }
  const so = t.closest('[data-shop-open]'); if (so && can()){ if (shopEdit && shopEdit !== so.dataset.shopOpen) await saveShopEdit(shopEdit); shopEdit = so.dataset.shopOpen; renderShop(); return; }
  const sd = t.closest('[data-shop-del]'); if (sd && can()){ const id = sd.dataset.shopDel;
    if (delArm !== id){ arm(id, renderShop); renderShop(); return; }
    delArm = null; try { await DB.collection('shop').doc(id).delete(); } catch(err){ writeFail(err); } return; }
  if (t.closest('[data-shop-clear]') && can()){
    if (delArm !== '__clear'){ arm('__clear', renderShop); renderShop(); return; }
    delArm = null; for (const x of S.shop.filter(s => s.done)){ try { await DB.collection('shop').doc(x.id).delete(); } catch(err){ writeFail(err); break; } } return; }
});
document.addEventListener('input', e => {
  if (e.target.id === 'e-amt'){ const v = +String(e.target.value).replace(/[^\d.]/g,''); const c = $('#e-conv'); if (c) c.textContent = v > 0 ? (F.cur === 'TWD' ? '≈ ' + yen(v / RATE()) : '≈ ' + twd(v)) : ''; }
});
document.addEventListener('keydown', e => {
  const el = e.target; if (!el) return;
  if (el.id === 'e-mate' && e.key === 'Enter'){ e.preventDefault(); addMateFromModal(); return; }
  if (el.dataset && el.dataset.shopEdit){
    if (e.key === 'Enter'){ e.preventDefault(); saveShopEdit(el.dataset.shopEdit); }
    if (e.key === 'Escape'){ shopEdit = null; renderShop(); }
  }
});
document.addEventListener('focusout', e => { const el = e.target; if (el.dataset && el.dataset.shopEdit) setTimeout(() => { if (shopEdit === el.dataset.shopEdit) saveShopEdit(shopEdit); }, 150); });


/* ---------- Tabs & events ---------- */
const VIEWS = ['plan','money','info','list'];
function show(v){
  if (!VIEWS.includes(v)) v = 'plan';
  VIEWS.forEach(x => { $('#v-'+x).hidden = x !== v; });
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.v === v));
  document.body.classList.add('on-plan');
  store.set('tk-view', v);
  window.scrollTo({top:0});
}
document.addEventListener('click', e => {
  const tab = e.target.closest('.tab'); if (tab){ show(tab.dataset.v); return; }
  const chip = e.target.closest('.dchip'); if (chip){ sel = +chip.dataset.day; store.set('tk-day', sel); renderPlan(); window.scrollTo({top:0}); return; }
  if (e.target.closest('.navbtn')) return;
  if (e.target.closest('[data-close]')){ closeSheet(); return; }
  const card = e.target.closest('.acard'); if (card){ openSheet(+card.dataset.item); return; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('acard')){ e.preventDefault(); openSheet(+e.target.dataset.item); }
});

function startApp(){
renderHeader(); renderPlan(); renderMoney(); renderInfo(); renderShop(); fillHeroStatus(); loadWeather();
initDb();
show(location.hash.slice(1) || store.get('tk-view','plan'));
setInterval(() => { const before = now.date; renderHeader(); if (now.date !== before || DAYS[sel].date === now.date) renderPlan(); fillHeroStatus(); }, 60000);
}

/* ---------- 開機：Google 登入 → 找到或建立／加入行程 ---------- */
const gate = document.getElementById('gate');
const joinFromHash = (location.hash.match(/^#join-([A-Za-z0-9]{6})$/) || [])[1];
if (joinFromHash) store.set('tk-pending-join', joinFromHash.toUpperCase());
const inApp = /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(navigator.userAgent);
const googleG = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function gateHtml(state, msg){
  const pending = store.get('tk-pending-join', '');
  const head = `<div class="g-hero"><div class="g-script">Tokyo</div><div class="g-sub">2026 年末東京自由行</div><div class="g-date num">12.29 – 01.05</div>${hollyI}</div>`;
  let body = '';
  if (state === 'loading') body = `<p class="g-p">讀取中…</p>`;
  else if (state === 'login') body = `${pending ? `<p class="g-p">你收到旅伴的邀請！登入後會自動加入這趟行程。</p>` : `<p class="g-p">用 Google 帳號登入，就能一起看行程、記帳、改購物清單。</p>`}
      ${inApp ? `<p class="g-err">你是在 LINE／IG 裡打開的，Google 不能在這裡登入。請按右上角「⋯」選「用預設瀏覽器開啟」（Safari 或 Chrome），再登入。</p>` : ''}
      <button class="g-btn" data-g="login">${googleG}用 Google 登入</button>`;
  else if (state === 'choose') body = `<p class="g-p">嗨 ${esc(AUTH && AUTH.displayName || '')}！你還沒有加入東京行程。</p>
      ${msg ? `<p class="g-err">${esc(msg)}</p>` : ''}
      <form id="g-join" class="g-join"><input id="g-code" maxlength="6" placeholder="輸入 6 碼邀請碼" autocomplete="off" autocapitalize="characters"><button class="g-btn sm" type="submit">加入</button></form>
      <div class="g-or">或</div>
      <button class="g-btn ghost" data-g="create">我是主揪，建立這趟行程</button>
      <p class="g-p" style="font-size:12.5px;opacity:.8">旅伴請不要按建立，要輸入主揪給的邀請碼，不然會變成兩趟分開的行程。</p>
      <button class="g-link" data-g="logout">換一個帳號</button>`;
  else body = `<p class="g-err">${esc(msg || '發生錯誤')}</p>`;
  return `<div class="g-card">${head}<div class="g-body">${body}</div></div>`;
}
function setGate(state, msg){ gate.hidden = false; gate.innerHTML = gateHtml(state, msg); }
function enter(t){ if (location.hash) history.replaceState(null, '', location.pathname); TRIP = t; gate.hidden = true; gate.innerHTML = ''; startApp(); }
async function afterLogin(u){
  AUTH = u; setGate('loading');
  const code = store.get('tk-pending-join', '');
  if (code){
    store.set('tk-pending-join', '');
    try { const t = await joinTrip(u, code); toast('已加入行程，歡迎！'); return enter(t); }
    catch(e){ const cur = await findMyTrip(u); if (cur) return enter(cur); return setGate('choose', e.message === 'not-found' ? '找不到這個邀請碼，請再確認一次' : '加入沒有成功，請再試一次'); }
  }
  const t = await findMyTrip(u);
  if (t) enter(t); else setGate('choose');
}
gate.addEventListener('click', async e => {
  const b = e.target.closest('[data-g]'); if (!b) return;
  if (b.dataset.g === 'login') signInGoogle().catch(err => { if (err && err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') toast('登入沒有成功，請再試一次'); });
  if (b.dataset.g === 'logout') logOut();
  if (b.dataset.g === 'create'){ b.disabled = true; b.textContent = '建立中…'; try { enter(await createTrip(AUTH)); } catch(err){ console.warn(err); setGate('choose', '建立沒有成功，請再試一次'); } }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'sw-join') return; e.preventDefault();
  const code = $('#sw-code').value.trim().toUpperCase(); if (!code) return;
  if (TRIP && code === TRIP.code){ toast('你已經在這趟行程裡了'); return; }
  try { await joinTrip(AUTH, code); toast('換好了，重新整理中…'); setTimeout(() => location.reload(), 600); }
  catch(err){ toast(err.message === 'not-found' ? '找不到這個邀請碼' : err.message === 'bad-code' ? '邀請碼是 6 個字' : '沒有成功，請再試一次'); }
});
gate.addEventListener('submit', async e => {
  if (e.target.id !== 'g-join') return; e.preventDefault();
  const code = $('#g-code').value.trim(); if (!code) return;
  try { enter(await joinTrip(AUTH, code)); toast('已加入行程，歡迎！'); }
  catch(err){ setGate('choose', err.message === 'not-found' ? '找不到這個邀請碼，請再確認一次' : err.message === 'bad-code' ? '邀請碼是 6 個字' : '加入沒有成功，請再試一次'); }
});
if (!configured) setGate('error', 'Firebase 設定還沒填好');
else { setGate('loading'); watchAuth(u => { if (!u){ AUTH = null; if (!TRIP) setGate('login'); else location.reload(); } else if (!TRIP) afterLogin(u); }); }
