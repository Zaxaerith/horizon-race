'use strict';

const I18N = (() => {
  const languages = [
    ['zh-CN','简体中文'], ['zh-TW','繁體中文'], ['en','English'],
    ['fr','Français'], ['es','Español'], ['pt','Português'],
    ['it','Italiano'], ['ja','日本語'], ['ko','한국어'],
    ['la','Latina'], ['el','Ελληνικά']
  ];
  const text = {
    start:['按 ENTER / 手柄A 开始','按 ENTER / 手把A 開始','Press ENTER / Gamepad A','Appuyez sur ENTRÉE / A','Pulsa ENTER / A','Pressione ENTER / A','Premi INVIO / A','ENTER / A でスタート','ENTER / A로 시작','Preme ENTER / A','Πατήστε ENTER / A'],
    tagline:['12车手 · 漂移涡轮 · 道具混战 · 支持手柄热切换','12車手 · 飄移渦輪 · 道具混戰 · 支援手把熱切換','12 racers · Drift turbo · Item battles · Hot-swap gamepad','12 pilotes · Turbo dérapage · Objets · Manette à chaud','12 pilotos · Turbo de derrape · Objetos · Mando en caliente','12 pilotos · Turbo de drift · Itens · Controle instantâneo','12 piloti · Turbo derapata · Oggetti · Gamepad istantaneo','12人レース · ドリフトターボ · アイテム · ゲームパッド対応','12명 레이스 · 드리프트 터보 · 아이템 · 게임패드 전환','XII aurigae · Turbo lapsus · Instrumenta · Manubrium','12 οδηγοί · Τούρμπο πλαγιολίσθησης · Αντικείμενα · Χειριστήριο'],
    controls:['WASD/方向键 驾驶 · SHIFT 漂移 · E 道具 · Q 后视 · P 暂停','WASD/方向鍵 駕駛 · SHIFT 飄移 · E 道具 · Q 後視 · P 暫停','WASD/Arrows drive · SHIFT drift · E item · Q rear view · P pause','WASD/Flèches conduire · SHIFT déraper · E objet · Q arrière · P pause','WASD/Flechas conducir · SHIFT derrapar · E objeto · Q atrás · P pausa','WASD/Setas dirigir · SHIFT drift · E item · Q traseira · P pausa','WASD/Frecce guida · SHIFT derapata · E oggetto · Q retro · P pausa','WASD/矢印 運転 · SHIFT ドリフト · E アイテム · Q 後方 · P ポーズ','WASD/방향키 운전 · SHIFT 드리프트 · E 아이템 · Q 후방 · P 일시정지','WASD/Sagittae rege · SHIFT labere · E utere · Q retro · P siste','WASD/Βέλη οδήγηση · SHIFT πλαγιολίσθηση · E αντικείμενο · Q πίσω · P παύση'],
    language:['语言','語言','Language','Langue','Idioma','Idioma','Lingua','言語','언어','Lingua','Γλώσσα'],
    play:['开始比赛','開始比賽','Start Race','Commencer','Iniciar carrera','Iniciar corrida','Inizia gara','レース開始','레이스 시작','Cursum incipe','Έναρξη αγώνα'],
    settings:['设置','設定','Settings','Paramètres','Ajustes','Configurações','Impostazioni','設定','설정','Optiones','Ρυθμίσεις'],
    resolution:['分辨率','解析度','Resolution','Résolution','Resolución','Resolução','Risoluzione','解像度','해상도','Resolutio','Ανάλυση'],
    frameRate:['帧率上限','影格率上限','Frame rate cap','Limite IPS','Límite de FPS','Limite de FPS','Limite FPS','フレーム上限','프레임 제한','Modus imaginum','Όριο FPS'],
    unlimited:['无限制','無限制','Unlimited','Illimité','Sin límite','Ilimitado','Illimitato','無制限','무제한','Sine limite','Χωρίς όριο'],
    keyBindings:['按键绑定','按鍵綁定','Key bindings','Touches','Asignación de teclas','Teclas','Comandi tastiera','キー設定','키 설정','Claves','Πλήκτρα'],
    bindLeft:['左转','左轉','Steer left','Tourner à gauche','Girar izquierda','Virar à esquerda','Sterza a sinistra','左へ曲がる','왼쪽 조향','Sinistrorsum','Στροφή αριστερά'],
    bindRight:['右转','右轉','Steer right','Tourner à droite','Girar derecha','Virar à direita','Sterza a destra','右へ曲がる','오른쪽 조향','Dextrorsum','Στροφή δεξιά'],
    bindAccel:['加速','加速','Accelerate','Accélérer','Acelerar','Acelerar','Accelera','アクセル','가속','Accelera','Επιτάχυνση'],
    bindBrake:['刹车','煞車','Brake','Freiner','Frenar','Frear','Frena','ブレーキ','브레이크','Frange','Φρένο'],
    bindDrift:['漂移','飄移','Drift','Déraper','Derrapar','Derrapar','Derapata','ドリフト','드리프트','Labere','Πλαγιολίσθηση'],
    bindItem:['使用道具','使用道具','Use item','Utiliser objet','Usar objeto','Usar item','Usa oggetto','アイテム使用','아이템 사용','Instrumento utere','Χρήση αντικειμένου'],
    bindLookBack:['后视','後視','Rear view','Vue arrière','Vista trasera','Visão traseira','Vista posteriore','後方確認','후방 보기','Retro specta','Πίσω όψη'],
    bindPause:['暂停','暫停','Pause','Pause','Pausa','Pausa','Pausa','ポーズ','일시정지','Siste','Παύση'],
    bindRestart:['重新开始','重新開始','Restart','Recommencer','Reiniciar','Reiniciar','Riavvia','リスタート','재시작','Reincepe','Επανεκκίνηση'],
    resetBindings:['恢复默认按键','恢復預設按鍵','Reset default keys','Rétablir les touches','Restaurar teclas','Restaurar teclas','Ripristina tasti','初期キーに戻す','기본 키 복원','Claves restitue','Επαναφορά πλήκτρων'],
    back:['返回','返回','Back','Retour','Volver','Voltar','Indietro','戻る','뒤로','Redi','Πίσω'],
    settingsHelp:['↑ ↓ 选择 · ← → 调整 · ENTER 确认 · ESC 返回','↑ ↓ 選擇 · ← → 調整 · ENTER 確認 · ESC 返回','↑ ↓ Select · ← → Change · ENTER Confirm · ESC Back','↑ ↓ Choisir · ← → Régler · ENTRÉE Valider · ESC Retour','↑ ↓ Elegir · ← → Cambiar · ENTER Confirmar · ESC Volver','↑ ↓ Escolher · ← → Alterar · ENTER Confirmar · ESC Voltar','↑ ↓ Seleziona · ← → Cambia · INVIO Conferma · ESC Indietro','↑ ↓ 選択 · ← → 変更 · ENTER 決定 · ESC 戻る','↑ ↓ 선택 · ← → 변경 · ENTER 확인 · ESC 뒤로','↑ ↓ Elige · ← → Muta · ENTER Confirma · ESC Redi','↑ ↓ Επιλογή · ← → Αλλαγή · ENTER Επιβεβαίωση · ESC Πίσω'],
    pressKey:['请按新按键（ESC 取消）','請按新按鍵（ESC 取消）','Press a new key (ESC cancels)','Appuyez sur une touche (ESC annule)','Pulsa una tecla (ESC cancela)','Pressione uma tecla (ESC cancela)','Premi un tasto (ESC annulla)','新しいキーを押す（ESCで取消）','새 키를 누르세요 (ESC 취소)','Novam clavem preme (ESC revocat)','Πατήστε νέο πλήκτρο (ESC ακύρωση)'],
    selectTrack:['选择赛道','選擇賽道','Select Track','Choisir une piste','Elegir pista','Escolher pista','Scegli pista','コース選択','트랙 선택','Circuitum elige','Επιλογή πίστας'],
    bestLap:['最佳单圈 {time}','最佳單圈 {time}','Best lap {time}','Meilleur tour {time}','Mejor vuelta {time}','Melhor volta {time}','Giro migliore {time}','ベストラップ {time}','최고 랩 {time}','Optimus circuitus {time}','Καλύτερος γύρος {time}'],
    selectHelp:['← → 切换 · ENTER 出发 · ESC 返回','← → 切換 · ENTER 出發 · ESC 返回','← → Change · ENTER Race · ESC Back','← → Changer · ENTRÉE Course · ESC Retour','← → Cambiar · ENTER Correr · ESC Volver','← → Trocar · ENTER Correr · ESC Voltar','← → Cambia · INVIO Gara · ESC Indietro','← → 変更 · ENTER スタート · ESC 戻る','← → 변경 · ENTER 시작 · ESC 뒤로','← → Muta · ENTER Curre · ESC Redi','← → Αλλαγή · ENTER Αγώνας · ESC Πίσω'],
    grid:['发车位: {pos} / 12','起跑位: {pos} / 12','Grid: {pos} / 12','Grille : {pos} / 12','Parrilla: {pos} / 12','Largada: {pos} / 12','Griglia: {pos} / 12','スタート位置: {pos} / 12','출발 위치: {pos} / 12','Locus: {pos} / 12','Θέση εκκίνησης: {pos} / 12'],
    finish:['完成!','完成!','FINISH!','ARRIVÉE !','¡META!','CHEGADA!','ARRIVO!','FINISH!','완주!','FINIS!','ΤΕΡΜΑ!'],
    you:['你','你','You','Vous','Tú','Você','Tu','あなた','나','Tu','Εσύ'],
    newRecord:['★ 单圈新纪录! ★','★ 單圈新紀錄! ★','★ New lap record! ★','★ Nouveau record ! ★','★ ¡Nuevo récord! ★','★ Novo recorde! ★','★ Nuovo record! ★','★ ラップ新記録! ★','★ 랩 신기록! ★','★ Novum recordum! ★','★ Νέο ρεκόρ γύρου! ★'],
    finishHelp:['ENTER 返回选赛道 · R 再来一局','ENTER 返回選賽道 · R 再來一局','ENTER Track select · R Retry','ENTRÉE Pistes · R Rejouer','ENTER Pistas · R Repetir','ENTER Pistas · R Repetir','INVIO Piste · R Riprova','ENTER コース選択 · R リトライ','ENTER 트랙 선택 · R 재시작','ENTER Circuitus · R Iterum','ENTER Πίστες · R Ξανά'],
    pause:['暂停','暫停','Paused','Pause','Pausa','Pausa','Pausa','ポーズ','일시정지','Pausa','Παύση'],
    pauseHelp:['P / START 继续 · ESC 返回 · R 重赛','P / START 繼續 · ESC 返回 · R 重賽','P / START Resume · ESC Exit · R Restart','P / START Reprendre · ESC Quitter · R Recommencer','P / START Seguir · ESC Salir · R Reiniciar','P / START Continuar · ESC Sair · R Reiniciar','P / START Continua · ESC Esci · R Riavvia','P / START 再開 · ESC 終了 · R リスタート','P / START 계속 · ESC 나가기 · R 재시작','P / START Perge · ESC Exi · R Reincepe','P / START Συνέχεια · ESC Έξοδος · R Επανεκκίνηση'],
    connected:['手柄已连接: {name}','手把已連接: {name}','Gamepad connected: {name}','Manette connectée : {name}','Mando conectado: {name}','Controle conectado: {name}','Gamepad connesso: {name}','ゲームパッド接続: {name}','게임패드 연결: {name}','Manubrium coniunctum: {name}','Χειριστήριο συνδέθηκε: {name}'],
    disconnected:['手柄已断开','手把已斷開','Gamepad disconnected','Manette déconnectée','Mando desconectado','Controle desconectado','Gamepad disconnesso','ゲームパッド切断','게임패드 연결 해제','Manubrium disiunctum','Το χειριστήριο αποσυνδέθηκε'],
    raceStart:['比赛开始!','比賽開始!','Go!','Partez !','¡Ya!','Vai!','Via!','スタート!','출발!','I!','Πάμε!'],
    miniTurbo:['迷你涡轮!','迷你渦輪!','Mini turbo!','Mini turbo !','¡Mini turbo!','Mini turbo!','Mini turbo!','ミニターボ!','미니 터보!','Turbo minor!','Μίνι τούρμπο!'],
    superTurbo:['超级涡轮!','超級渦輪!','Super turbo!','Super turbo !','¡Súper turbo!','Super turbo!','Super turbo!','スーパーターボ!','슈퍼 터보!','Turbo maximus!','Σούπερ τούρμπο!'],
    lap:['第 {lap} 圈!','第 {lap} 圈!','Lap {lap}!','Tour {lap} !','¡Vuelta {lap}!','Volta {lap}!','Giro {lap}!','ラップ {lap}!','{lap} 랩!','Circuitus {lap}!','Γύρος {lap}!'],
    shellHit:['被龟壳击中!','被龜殼擊中!','Hit by a shell!','Touché par une carapace !','¡Golpe de caparazón!','Atingido por casco!','Colpito da un guscio!','こうら命中!','등껍질에 맞음!','Testa ictus!','Χτύπημα από καβούκι!'],
    bananaHit:['踩到香蕉皮!','踩到香蕉皮!','Slipped on a banana!','Banane écrasée !','¡Pisaste un plátano!','Escorregou na banana!','Scivolato su una banana!','バナナでスピン!','바나나를 밟음!','In banana lapsus!','Πάτησες μπανάνα!'],
    lightningHit:['遭到闪电攻击!','遭到閃電攻擊!','Struck by lightning!','Frappé par la foudre !','¡Golpe de rayo!','Atingido por raio!','Colpito dal fulmine!','サンダー攻撃!','번개 공격!','Fulmine ictus!','Χτύπημα κεραυνού!'],
    slip:['打滑了!','打滑了!','Slipping!','Dérapage !','¡Derrape!','Derrapando!','Sbandata!','スリップ!','미끄러짐!','Lapsus!','Ολίσθηση!'],
    obstacle:['撞到路障!','撞到路障!','Hit an obstacle!','Obstacle heurté !','¡Obstáculo golpeado!','Bateu no obstáculo!','Ostacolo colpito!','障害物に衝突!','장애물 충돌!','Obex ictus!','Χτύπημα σε εμπόδιο!'],
    hardHit:['猛烈碰撞!','猛烈碰撞!','Heavy impact!','Choc violent !','¡Impacto fuerte!','Impacto forte!','Impatto violento!','激突!','강한 충돌!','Ictus gravis!','Σφοδρή σύγκρουση!'],
    kartHit:['撞击!','撞擊!','Impact!','Collision !','¡Choque!','Colisão!','Impatto!','ヒット!','충돌!','Ictus!','Σύγκρουση!'],
    lapHud:['圈 {lap}/{total}','圈 {lap}/{total}','LAP {lap}/{total}','TOUR {lap}/{total}','VUELTA {lap}/{total}','VOLTA {lap}/{total}','GIRO {lap}/{total}','ラップ {lap}/{total}','랩 {lap}/{total}','CIRC {lap}/{total}','ΓΥΡΟΣ {lap}/{total}'],
    posHud:['名次 {pos}/12','名次 {pos}/12','POS {pos}/12','POS {pos}/12','POS {pos}/12','POS {pos}/12','POS {pos}/12','順位 {pos}/12','순위 {pos}/12','LOC {pos}/12','ΘΕΣΗ {pos}/12'],
    bestHud:['最佳 {time}','最佳 {time}','BEST {time}','MAX {time}','MEJOR {time}','MELHOR {time}','MIGLIORE {time}','BEST {time}','최고 {time}','OPT {time}','ΚΑΛΥΤΕΡΟΣ {time}'],
    turbo:['涡轮','渦輪','TURBO','TURBO','TURBO','TURBO','TURBO','ターボ','터보','TURBO','ΤΟΥΡΜΠΟ'],
    ice:['低抓地冰面','低抓地冰面','LOW-GRIP ICE','GLACE GLISSANTE','HIELO DESLIZANTE','GELO ESCORREGADIO','GHIACCIO SCIVOLOSO','低グリップ氷面','저그립 빙판','GLACIES LUBRICA','ΟΛΙΣΘΗΡΟΣ ΠΑΓΟΣ'],
    heat:['热风区!','熱風區!','HEAT GUST!','RAFALE CHAUDE !','¡RÁFAGA CALIENTE!','RAJADA QUENTE!','RAFFICA CALDA!','熱風ゾーン!','열풍 구간!','VENTUS CALIDUS!','ΘΕΡΜΗ ΡΙΠΗ!'],
    heatWarn:['注意热风区','注意熱風區','WATCH FOR HEAT','ATTENTION CHALEUR','CUIDADO CON EL CALOR','CUIDADO COM O CALOR','ATTENZIONE AL CALORE','熱風に注意','열풍 주의','CAVE CALOREM','ΠΡΟΣΟΧΗ ΣΤΗ ΘΕΡΜΟΤΗΤΑ']
  };
  const trackNames = {
    mushroom:['蘑菇平原','蘑菇平原','Mushroom Circuit','Circuit Champignon','Circuito Champiñón','Circuito Cogumelo','Circuito Fungo','キノコサーキット','버섯 서킷','Circuitus Fungorum','Πίστα Μανιταριών'],
    coast:['日落海岸','日落海岸','Sunset Coast','Côte du Couchant','Costa del Atardecer','Costa do Pôr do Sol','Costa del Tramonto','サンセットコースト','노을 해안','Litus Solis Occidentis','Ακτή Ηλιοβασιλέματος'],
    desert:['烈日沙漠','烈日沙漠','Dune Drifter','Dérive des Dunes','Derrape de Dunas','Drift das Dunas','Derapata delle Dune','デューンドリフター','사막 드리프트','Dunae Volantes','Ολίσθηση Αμμόλοφων'],
    snow:['冰峰滑道','冰峰滑道','Frost Peak','Pic de Givre','Pico Helado','Pico Gelado','Picco Gelato','フロストピーク','서리 봉우리','Cacumen Gelidum','Παγωμένη Κορυφή'],
    city:['霓虹都市','霓虹都市','Neon City','Ville Néon','Ciudad Neón','Cidade Neon','Città Neon','ネオンシティ','네온 시티','Urbs Neonis','Πόλη Νέον'],
    volcano:['火山狂飙','火山狂飆','Volcano Rush','Ruée Volcanique','Furia Volcánica','Corrida Vulcânica','Corsa Vulcanica','ボルケーノラッシュ','화산 질주','Cursus Vulcanus','Ηφαιστειακή Ορμή'],
    forest:['迷雾森林','迷霧森林','Misty Forest','Forêt Brumeuse','Bosque Nebuloso','Floresta Nebulosa','Foresta Nebbiosa','ミスティフォレスト','안개 숲','Silva Nebulosa','Ομιχλώδες Δάσος'],
    rainbow:['彩虹天际','彩虹天際','Rainbow Horizon','Horizon Arc-en-ciel','Horizonte Arcoíris','Horizonte Arco-íris','Orizzonte Arcobaleno','レインボーホライズン','무지개 지평선','Horizon Iridis','Ορίζοντας Ουράνιου Τόξου']
  };
  const rules = {
    snow:['冰雪路面：转向抓地力较低，入弯要提前减速','冰雪路面：轉向抓地力較低，入彎要提前減速','Icy road: lower grip; brake before corners','Route glacée : moins d’adhérence, freinez tôt','Hielo: menos agarre; frena antes de las curvas','Gelo: menos aderência; freie antes das curvas','Ghiaccio: meno aderenza; frena prima delle curve','氷面：グリップが低い。早めに減速','빙판: 접지력이 낮으므로 일찍 감속','Glacies: adhaesio minor; ante curvas frange','Πάγος: χαμηλή πρόσφυση· φρενάρετε νωρίς'],
    volcano:['热风区：橙色路段会周期性推动车身','熱風區：橙色路段會週期性推動車身','Heat gusts: orange zones push your kart','Rafales : les zones orange poussent le kart','Ráfagas: las zonas naranjas empujan el kart','Rajadas: zonas laranja empurram o kart','Raffiche: le zone arancioni spingono il kart','熱風：オレンジ区間で車体が流される','열풍: 주황 구간에서 카트가 밀림','Ventus: viae aurantiacae currum impellunt','Ριπές: οι πορτοκαλί ζώνες σπρώχνουν το καρτ']
  };
  const itemNames = {
    mushroom:['加速蘑菇','加速蘑菇','Boost Mushroom','Champignon turbo','Champiñón turbo','Cogumelo turbo','Fungo turbo','ダッシュキノコ','대시 버섯','Fungus Celeritatis','Μανιτάρι Τούρμπο'],
    triple:['三重蘑菇','三重蘑菇','Triple Mushroom','Triple champignon','Triple champiñón','Cogumelo triplo','Triplo fungo','トリプルキノコ','트리플 버섯','Tres Fungi','Τριπλό Μανιτάρι'],
    banana:['香蕉皮','香蕉皮','Banana Peel','Peau de banane','Cáscara de plátano','Casca de banana','Buccia di banana','バナナ','바나나 껍질','Cortex Musae','Μπανανόφλουδα'],
    green:['绿龟壳','綠龜殼','Green Shell','Carapace verte','Caparazón verde','Casco verde','Guscio verde','ミドリこうら','초록 등껍질','Testa Viridis','Πράσινο Καβούκι'],
    red:['红龟壳','紅龜殼','Red Shell','Carapace rouge','Caparazón rojo','Casco vermelho','Guscio rosso','アカこうら','빨강 등껍질','Testa Rubra','Κόκκινο Καβούκι'],
    star:['无敌星星','無敵星星','Invincibility Star','Étoile invincible','Estrella invencible','Estrela invencível','Stella invincibile','スーパースター','무적 별','Stella Invicta','Αστέρι Αήττητο'],
    lightning:['闪电','閃電','Lightning','Éclair','Rayo','Raio','Fulmine','サンダー','번개','Fulmen','Κεραυνός']
  };
  let savedLanguage = '';
  try { savedLanguage = localStorage.getItem('hr_language') || ''; } catch (e) {}
  let index = Math.max(0, languages.findIndex(([id]) => id === savedLanguage));
  function format(value, vars) {
    return value.replace(/\{(\w+)\}/g, (_, key) => vars && vars[key] != null ? vars[key] : '');
  }
  function set(next) {
    index = (next + languages.length) % languages.length;
    try { localStorage.setItem('hr_language', languages[index][0]); } catch (e) {}
    if (document.documentElement) document.documentElement.lang = languages[index][0];
  }
  function position(n) {
    if (index !== 2) return String(n);
    const mod100 = n % 100;
    const suffix = mod100 >= 11 && mod100 <= 13 ? 'th'
      : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
    return `${n}${suffix}`;
  }
  set(index);
  return {
    languages,
    t: (key, vars) => format((text[key] || text.start)[index], vars),
    trackName: id => (trackNames[id] || [id])[index] || id,
    trackRule: id => rules[id] ? rules[id][index] : '',
    itemName: id => (itemNames[id] || [id])[index] || id,
    position,
    cycle: step => set(index + step),
    get id() { return languages[index][0]; },
    get label() { return languages[index][1]; }
  };
})();
