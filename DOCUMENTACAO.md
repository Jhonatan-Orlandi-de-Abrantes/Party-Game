# Party Game — Documentação do Projeto

> **Objetivo deste arquivo:** explicar o que é o projeto, como funciona e para que
> serve cada pasta/arquivo, para que uma IA (ou outro desenvolvedor) entenda o
> código sem precisar ler linha por linha.

---

## 1. O que é o projeto

**Party Game** é um jogo de plataforma multiplayer **local** (roda em um único
computador), inspirado em jogos como *PICO PARK* e *Level Devil*.

- Cada jogador abre o jogo em uma **aba/janela diferente** do navegador (ou em
  janelas lado a lado) e participa da mesma sala.
- Não existe servidor nem rede: a sincronização acontece via
  **`localStorage` + eventos `storage`** do navegador, que são compartilhados
  entre abas do mesmo navegador/origem.
- Um dos jogadores é o **HOST** (criador da sala). O host **simula** a partida
  (física, bomba, colisões) e publica o estado do jogo no `localStorage`. Os
  outros jogadores (**clientes**) apenas **leem** esse estado e renderizam.
  Se o host parar de publicar (aba fechada/invisível), qualquer cliente assume
  a simulação automaticamente.
- Cada jogador controla seu personagem com o **teclado** e/ou um **gamepad**
  (controle). O input de cada um é publicado no `localStorage` por
  playerId, e o host lê esses inputs para simular.

**Mecânica principal:** a bomba passa de jogador em jogador ao encostar. Quem
estiver segurando a bomba quando o tempo (15s) zerar, explode e perde a rodada.
O cronômetro **não reseta nem ganha +2s** ao passar a bomba — ele apenas
continua contando. O último de pé vence e vê uma tela de vitória com coroa 👑.

**Extras implementados:**
- Tela de configurações em aba deslizante (engrenagem no lobby): cor e chapéu do
  personagem, auto-pass, atalhos personalizáveis (com reset), FPS/ping, limite
  de FPS, resolução do jogo e volume de música/efeitos.
- **Lobby:** o **código da sala (4 letras) aparece em negrito**; o contador
  **"Jogadores: x/y"** é **negrito** e colorido — **amarelo** enquanto houver
  vaga, **verde** quando a sala está cheia — e "Jogadores na sala" e os blocos
  de jogador têm margem extra.
- **Dash indicator:** a barrinha de cooldown do dash foi **ampliada** (34×7, mais
  larga e mais alta, posicionada abaixo do jogador).
- **Partida mista (sem seletor de modo):** ao clicar em **"Criar sala"** a sala
  já é criada (sem modal de modo). Os jogadores podem jogar tanto em **abas
  separadas** quanto **na mesma tela** (com controle). O botão **"Convidar"**
  fica sempre visível no lobby.
- **Modo Local na mesma tela (até 4 jogadores):** ao conectar um controle e
  pressionar qualquer botão, abre um modal perguntando se o controle deve ser
  **atribuído a um jogador existente** desta tela ou se deve **criar um novo
  jogador** (pede um apelido). O novo jogador entra na sala, controla com o
  gamepad e configura **só cor e chapéu** na aba de configurações (o **título
  da aba** mostra "Configurações de {nome}" — nome na cor do jogador, com
  reticências "…" quando o apelido é muito longo — indicando quem está sendo
  editado). Vários jogadores
  locais são publicados como inputs separados (cada um no seu playerId).
- **Convite:** o lobby tem o botão **"Convidar"** (vermelho claro), que abre
  um modal com o **link de convite** (`...?room=CÓDIGO`) e botão "Copiar link".
  Quem abre o link tem o código **pré-preenchido** na tela inicial — basta
  digitar o apelido e entrar.
- **Menus por controle:** cada aba só responde ao gamepad **atribuído a um
  jogador daquela aba** — corrige o bug em que um controle agia nos menus de
  duas abas ao mesmo tempo. O seletor de menu (`ui-focus`) fica **na cor do
  jogador** que está usando aquele controle.
- **Dois controles navegando menus ao mesmo tempo:** o foco de menu é **por
  jogador** (`uiFocusMap`, uma chave por jogador local + teclado), então dois
  gamepads (ou um gamepad + teclado) podem focar elementos diferentes no mesmo
  lobby/configurações simultaneamente, cada um na cor do seu jogador. As
  configurações seguem **quem abriu** (`configTargetId`).
- **"Options" em jogo:** apertar o botão **Options** do controle abre a tela de
  **"Voltar para o lobby?"** (Confirmar/Cancelar); apertar de novo fecha e
  volta ao jogo. O ✕ da tela de jogo faz o mesmo.
- **Dash nos dois gatilhos:** RT **ou** LT disparam o dash (legenda "Dash:
  RT/LT").
- **Partículas de caminhada:** quadrados sólidos da cor do personagem (sem
  borda), que sobem levemente e somem — visual puro, sem elipse/contorno.
- Chapéus personalizados (persistidos por navegador via `deviceId`).
- Timer da bomba no **topo central** da tela em fonte pixel, com cores por
  urgência (verde → amarelo → vermelho pulsante).
- Indicador visual do seu personagem: **barra horizontal sob os pés** (16×4)
  pulsante na cor escolhida, que também serve de **medidor do cooldown do dash**
  (preenche em amarelo durante o cooldown e volta a pulsar verde quando pronto)
  — mostrado para **todos os jogadores locais** da aba, no lugar da antiga
  borda.
- **Placar de pontuação:** ao fim de cada rodada o jogo dá **pontos distintos**
  por posição (vencedor primeiro, depois os demais pela pontuação acumulada,
  perdedor da rodada por último; pontos = nº de jogadores − posição). A pontuação
  de cada jogador persiste na sala e o placar aparece no fim da rodada com
  **1º 👑 (coroa brilhante), 2º, 3º, 4º** — um lugar para cada jogador.
- **Fim de rodada na mesma tela:** mostra **somente o placar** com o título
  **"👑 {NOME} VENCEU! 👑"** — nome do vencedor na cor dele — sem tela de
  "Explodiu"/"Ganhou", sem confete e sem
  som de vitória (só o contador regressivo toca). Os nomes no placar aparecem
  **na cor de cada jogador**. O gamepad **age na mensagem na 1ª apertada do A**
  (foca e já confirma "Voltar para o lobby").
- **"Você":** jogadores da **mesma tela** aparecem marcados como **"Você"** no
  lobby (para os que estão em outra aba, o nome do jogador local é mostrado).
- **Menu de cosméticos com direcional:** o seletor de chapéus navega em **grade
  2D** (cima/baixo/esquerda/direita) com o controle, com wrap por linha e
  "Fechar" no fim da lista. As colunas são detectadas em tempo real pela
  **posição real de cada item** (`getBoundingClientRect`), funcionando em
  qualquer largura de tela, mesmo com a grade rolada.
- **Menu por controle sem auto-clique:** o seletor de controle (Teclado/
  Controle) **não muda mais com o direcional** — só com o botão de confirmação
  (A, abre as opções nativas via `showPicker`), evitando que o menu "entre
   sozinho". O seletor é editável também pelos **jogadores locais** desta tela
   (e o HOST). Botão **Options/B** fecha modais, a aba de configurações e, no fim
   da partida, volta ao lobby.
- **Instruções e código da sala:** o texto "Como jogar" do lobby agora explica
  o objetivo da partida ("Encoste em outro jogador para passar a bomba…") e o
  **código da sala fica centralizado** no topo do lobby, com o espaçamento
  adequado entre o placar e o botão "Voltar para lobby".
- **Controles touch mobile:** dois estilos — **botões de setas** (esquerda/
  direita + pular + dash) ou **joystick analógico** (stick virtual + pular +
  dash). Layout totalmente customizável via editor de arrastar-e-soltar. As
  posições são salvas por dispositivo no `localStorage`. Os controles são
  ocultados quando a rodada termina.
- **Sistema de doação PIX:** botão de doação visível no jogo, abre um modal com
  código PIX copia-e-cola e botão "Copiar código PIX". Suporta presets de valores
  salvos no `localStorage`.
- **Sistema de mapas:** 6 mapas únicos (Clássico, Torres, Escadas, Ilhas,
  Arena, Ziguezague), cada um com cores de fundo e plataformas próprias.
  Selecionados aleatoriamente sem repetição (cicla todos antes de repetir).
- **Design responsivo:** breakpoint em 720px para adaptação em telas menores.

---

## 2. Como executar

Não há build nem dependências. Basta servir a pasta raiz por um servidor HTTP
estático (módulos ES exigem HTTP):

```
npx serve .
# ou: python -m http.server 8000
```

Depois abra `http://localhost:8000` em **duas ou mais abas/janelas** do mesmo
navegador:
1. Na primeira aba, clique em **"Criar sala"** e crie a sala (vira HOST). Não há
   escolha de modo — a partida é mista (abas separadas e/ou mesma tela).
2. Nas outras, entrem com o código da sala (ou pelo **link de convite**
   `?room=CÓDIGO`, que pré-preenche o código).
3. No lobby, cada um escolhe seu controle (Teclado / Controle 1–4) e pode abrir
   a engrenagem ⚙ para ajustar cor, chapéu, atalhos, FPS, resolução e volume.
   Conecte um controle e pressione um botão: o jogo pergunta
   se você quer **atribuir o controle a um jogador desta tela** ou **criar um
   novo jogador** (com apelido) — assim dá para jogar com até 4 jogadores numa
   única tela.
4. O HOST clica em "Iniciar partida".

**Importante:** como usa `localStorage`, todos os jogadores devem estar no
mesmo navegador e na mesma origem. Não funciona entre máquinas diferentes
(arquitetura atual).

---

## 3. Estrutura de pastas e arquivos

```
PartyGame/
├── index.html              → Estrutura HTML das telas (welcome, lobby, game) + popups/modal
├── DOC-IDEIAS-APLICACOES.url → Atalho para Google Doc com ideias futuras
├── JOGOS-REFERENCIA.txt      → Jogos usados como referência visual/sonora
├── plano-online.png          → Imagem/plano do modo online (referência futura)
├── REFERENCIAS-MAPAS/        → Imagens de referência para mapas (ilhas.jpg, ziguezague.jpg)
├── src/
│   ├── css/
│   │   └── style.css         → Todos os estilos (cartões, aba de configs, chapéus, modal, confete, touch, responsivo)
│   ├── Images/
│   │   ├── BombGame/
│   │   │   └── bomb.png      → Sprite da bomba
│   │   ├── Pix/
│   │   │   └── qrcode-pix.jpeg → Imagem estática do QR code PIX
│   │   └── icon/
│   │       └── icon.png      → Favicon do navegador
│   └── js/
│       ├── main.js           → Ponto de entrada: orquestra tudo, loops, eventos, transições
│       ├── constants.js      → Constantes de jogo (física, timer, teclas, prefixos de storage)
│       ├── state.js          → Estado global compartilhado + helpers (getMyPlayer, isHost)
│       ├── storage.js        → Camada de leitura/escrita do localStorage
│       ├── rooms.js          → Salas, jogadores, host, modo, heartbeat, limpeza de inativos
│       ├── input.js          → Input de teclado/gamepad; publicação por playerId; atalhos custom
│       ├── game.js           → Simulação da partida (física, bomba, colisões, partículas)
│       ├── render.js         → Desenho no canvas (personagens, timer, chapéus, FPS/ping)
│       ├── maps.js           → Definição dos 6 mapas (nome, cores, plataformas)
│       ├── hats.js           → Catálogo e desenho dos chapéus (canvas) + previews
│       ├── ui.js             → DOM/UI: lobby, aba de configs, seleção de chapéu, modal de confirmação
│       ├── touch.js          → Controles touch mobile (setas/analogico, editor de layout)
│       ├── donate.js         → Modal de doação PIX com código copia-e-cola
│       ├── audio.js          → Música (menu/jogo) e efeitos (WebAudio + mp3), com volumes
│       ├── effects.js        → Confetes (efeitos visuais DOM, ancoráveis a um elemento)
├── musics/
│   ├── menu/               → Música do menu (menu1.mp3 … menu5.mp3)
│   ├── game/               → Música da partida (gm1.mp3 … gm11.mp3)
│   └── game-RUN/           → Reservado para futuro modo "CORRA!" (gmr1.mp3)
└── sounds/
    ├── countdown/           → Sons de contagem regressiva (countdown.mp3, start-menu.mp3)
    ├── jump/                → Sons de pulo (sorteado dinamicamente da pasta: jump1.mp3, …)
    ├── kill/                → Sons de explosão/morte
    ├── leaderboard/         → Sons de placar
    └── victory/             → Sons de vitória
```

---

## 4. Detalhes de cada arquivo JS

### `src/js/main.js` (orquestrador)
- Importa e conecta os módulos; registra callbacks (`setOnRoundEnd`,
  `setOnToast`).
- Controla os **dois loops**:
  - `gameLoop` → simula (`stepGame`) e publica o estado a cada ~33ms
    (`PUBLISH_INTERVAL`). Usa **fixed timestep**: acumula o tempo real e avança
    a simulação em passos fixos de `SIM_STEP = 1/60`, para o jogo rodar em
    tempo real independente da taxa de quadros e do limite de FPS.
  - `clientRenderLoop` → lê o estado publicado e redesenha o canvas.
- **Limite de FPS** (`getFpsLimit`, 0 = sem limite): ambos os loops pulam frames
  com `requestAnimationFrame` até passar o intervalo de 1000/limite.
- **Convergência de fim de rodada:** `gameLoop` e `becomeSimulator` checam o
  estado compartilhado; se outra aba já publicou `roundResult`, param a
  simulação e mostram o resultado. Isso evita que dois simuladores se
  sobrescrevam e apaguem o fim da rodada.
- `becomeSimulator()`: se o host parar de publicar (aba invisível/fechada), um
  cliente assume a simulação para a partida não travar.
- `applyResolution()`: aplica a escala de resolução do player (5–100%) no canvas
  (`canvas.width/height` = `1080·escala` × `540·escala`) e repassa ao `render.js`.
- Trata os eventos de `storage` (outra aba mudou a sala): detecta **quem entrou
  e quem saiu** no lobby, mostra alertas ("X saiu" vermelho, "Você agora é o
  HOST!" amarelo) e confetes.
- Configura músicas (menu vs. jogo), efeitos de botão, confete ao iniciar
  partida, e os handlers da UI (cor, auto-pass, FPS/ping, resolução, volume).
- **Confirmações:** sair da sala (lobby e aba de configs) e voltar ao lobby
  durante o jogo (botão ✕ ou botão **Options** do controle) passam por um modal
  de confirmação. Em jogo, apertar **Options** abre o modal e apertar de novo o
  fecha (volta ao jogo).
- **Menus por controle (`pollUiGamepad`):** a aba só reage ao gamepad
  **atribuído a um jogador desta aba** (`localPlayerIds`). Isso corrige o bug de
  um controle agir nos menus de duas abas ao mesmo tempo.
- **Slider por controle:** analógico move 10 unidades, setas direcionais move 1.
- **Paleta de cores por controle:** navegação em grade 2D (cima/baixo/esquerda/
  direita) na seletor de cores, com wrap por linha.
- **Troca de gamepad:** ao selecionar um pad que já está em uso por outro
  jogador, os pads são trocados automaticamente (ao invés de mostrar erro).
- **Placar navegável por controle:** o results overlay (tela de vitória com
  podium) agora é focável pelo controle — pode navegar e clicar "Voltar ao lobby"
  com o botão A.
- **Modo Local — conectar controle (`checkLocalPadConnect`):** no lobby,
  se um controle **não atribuído** tiver um botão pressionado, abre o modal de
  atribuição (`showPadConnect`) — atribuir a um jogador desta tela ou criar um
  novo jogador.
- **Convite (`?room=CÓDIGO`):** o link é montado no lobby e o código é
  **pré-preenchido** na tela inicial por `prefillRoomCodeFromUrl()`.
- Intervals: `heartbeat` (mantém jogadores vivos), `cleanupStalePlayers`
  (remove inativos), publicação de input (`publishLocalInputs`).

### `src/js/constants.js`
- Todas as constantes ajustáveis do jogo: tempo da bomba (`MAX_BOMB_TIME = 15`),
  cooldown do dash, física (`GRAVITY`, `RUN_SPEED`, `JUMP_SPEED`, `DASH_SPEED`),
  tamanho do jogador, distância de passagem da bomba.
- `controlSets`: configuração de teclas padrão por player (fallback dos atalhos).
- **Prefixos de chave do `localStorage`** usados por `storage.js` (incluindo os
  novos: limite de FPS, resolução, atalhos, chapéu, volumes e `deviceId`).
- Caminho da imagem da bomba, cores de explosão, nome do modo.

### `src/js/state.js`
- Objeto `state` global: salas, jogador atual, estado do jogo, teclas
  pressionadas, partículas, imagem da bomba, flags de tela e os controles de
  loop (`accTime`, `lastFrameTime`).
- **Jogadores locais da aba:** `localPlayerIds` (array de playerIds que esta
  aba controla — pode ter vários) e `saveLocalPlayers(ids)` que
  persiste em `sessionStorage` (`bombPartyLocalPlayers`).
- **Quem está sendo configurado:** `configTargetId` (player da aba de
  configurações) e `uiPadPlayerId` (dono do gamepad que navegou por último —
  define o alvo ao abrir a aba de configurações pelo menu).
- Helpers: `getMyPlayer()` (meu player na sala atual), `isHost()`,
  `getControlsForPlayer()`.

### `src/js/storage.js`
- Camada única de acesso ao `localStorage`. Funções:
  - Salas: `loadRooms` / `saveRooms` / `syncRooms`.
  - Estado do jogo: `readGameState` / `publishGameState` (chave por código de sala).
  - Input: `writePlayerInput` / `readPlayerInput` / `removePlayerInput`
    (chave por playerId).
  - Configurações por player: `getAutoPass`/`saveAutoPass`,
    `getGamepadAssignment`/`saveGamepadAssignment` (índice do gamepad, -1 = teclado),
    `getFpsEnabled`/`saveFpsEnabled`, `getFpsColor`/`saveFpsColor`,
    `getFpsLimit`/`saveFpsLimit` (0 = sem limite, senão 5–240),
    `getResolution`/`saveResolution` (0.05–1),
    `getCustomKeys`/`saveCustomKeys`/`resetCustomKeys` (JSON de atalhos).
  - Por dispositivo (persistente): `getDeviceId()` (UUID único por navegador),
    `getHat`/`saveHat`, `getTouchEnabled`/`saveTouchEnabled`,
    `getTouchStyle`/`saveTouchStyle`, `getTouchLayout`/`saveTouchLayout`/
    `resetTouchLayout`.
  - Globais: `getMusicVolume`/`setMusicVolume`, `getSfxVolume`/`setSfxVolume`
    (0–100, padrão 70 e 90), `bombPartyPixPresets` (presets de valores PIX).

### `src/js/rooms.js`
- Criação/entrada em salas, geração de código (`randomCode`) e cor (`randomColor`).
- `createRoom(nickname, maxPlayers, mode)`: `mode` é `'local'` (padrão) — a
  partida é **mista** (abas separadas e/ou mesma tela). Cada jogador recebe
  `deviceId` (do navegador), `hat` salvo e `score: 0`. Ao criar/entrar,
  `localPlayerIds` é resetado para `[meu playerId]`.
- `addLocalPlayer(nickname)`: cria um **jogador local** na sala atual (marca
  `local: true`), valida (sala cheia / apelido repetido / partida iniciada) e
  adiciona o id a `localPlayerIds`. Retorna `{ player }` ou `{ error }`.
- `leaveRoom` / `removePlayerFromRoom`: remoção com **transferência de host**
  (o primeiro jogador restante vira host). `leaveRoom` agora remove **todos os
  jogadores locais da aba** e limpa `localPlayerIds`.
- `startGame`: valida (só host, mínimo 2 jogadores) e marca `room.started`.
- `heartbeat`: atualiza `lastSeen` de **todos os jogadores locais** (meu player
  + `localPlayerIds`) a cada ~2s, para os locais não caírem como inativos.
- `cleanupStalePlayers`: remove jogadores inativos (8s), transfere host,
  limpa `localPlayerIds` se a sala atual sumir e **retorna**
  `{ dropped, removedPlayers }` para a UI exibir alertas de saída detectados
  localmente (sem depender de evento `storage`).
- `roomSignature`: assinatura da sala (inclui `mode`, `score` e `hat` de cada
  player) usada para detectar mudanças entre abas.

### `src/js/input.js`
- `getEffectiveControls(playerId)`: retorna os atalhos **efetivos** de um player
  (atos customizados via `bombPartyKeys_<id>` sobrepostos ao `controlSets`
  padrão).
- `publishPlayerInput(playerId, includeKeyboard)`: monta o objeto de teclas
  (esquerda/direita/pular/passar/dash) de **qualquer** player — teclado (se
  `includeKeyboard`) + gamepad atribuído — e grava no `localStorage`.
- `publishMyInput()`: wrapper do meu player (teclado + gamepad).
- `publishLocalInputs()`: publica o input de **todos os jogadores locais da
  aba** (`localPlayerIds`; o teclado só vale para o player principal `myPlayerId`).
  Usado pelos intervals do main.js.
- `getPlayerKeys(player)`: lê o input de qualquer player (usado pelo host na
  simulação).
- `readGamepad`/`connectedGamepads`: Gamepad API. Mapeamento do controle:
  - Mover: analógico esquerdo (ou direcional)
  - Pular: botão **A** (ou direcional para cima)
  - Passar: botão **X** (ou **Y**)
  - Dash: **RT** ou **LT** (ou **B**)
- `onKeyDown`/`onKeyUp`: registram teclas e publicam imediatamente.

### `src/js/game.js` (simulação — só roda no HOST)
- `initGame()`: cria jogadores, plataformas, escolhe quem inicia com a bomba.
- `stepGame(dt)`: física (gravidade, fricção, dash), colisões com plataformas,
  passagem da bomba, partículas.
- **Regras da bomba:** ao ser passada, o timer **não reseta e não ganha +2s** —
  apenas continua de onde estava (`target.bombTime = gs.bombTime`). Há um
  `passCooldown` de 0.6s no alvo para a troca ficar visível (senão a
  auto-passagem trocaria a bomba a cada frame).
- `endRound()`: explodiu → marca `running=false`, define o **resultado** com
  `winnerId`, `loserId`, `loserName`, grava `gs.roundResult`, publica o estado
  (para os clientes verem o fim da rodada) e chama `onRoundEnd`.
- `awardRoundPoints(result)`: **placar de pontuação** — ordena os jogadores
  (vencedor em 1º, demais por pontuação acumulada, perdedor da rodada em
  último), dá `n − posição` pontos (n = nº de jogadores, sempre distintos),
  persiste (`saveRooms`) e anexa `result.scoreboard = [{id, nickname, color,
  score, place}]`.
- `spawnDashParticles`: cria as partículas cinzas do dash (sobem, somem).
- **Rastro de "vento" no pé:** ao correr no chão, registra pontos no pé com o
  timestamp do jogo (`t: gs.time`); pontos antigos são podados após
  `TRAIL_LIFE` (0.35s).

### `src/js/render.js` (desenho no canvas)
- `drawScene()`: fundo, plataformas, partículas, personagens (com chapéu),
  bombas, dash indicator, **timer central**, **coroa do líder** e overlay de
  FPS/ping.
- `drawLeaderCrown()`: coroa dourada **brilhante** (pulso de `shadowBlur`)
  acima do **líder** (único jogador com maior `score` > 0), desenhada após os
  personagens.
- `setResolutionScale(scale)`: o canvas é desenhado sempre no espaço lógico
  **1080×540**; a escala só muda o tamanho do backing store (`setTransform`).
- `drawPlayer()`: personagens estilo **PICO PARK** (corpo redondo, pés, olhos,
  boca) com **animação ao andar** (pés balançam + corpo quica) e **ao pular**
  (corpo estica, pés recolhidos). O **seu** personagem (e **todos os jogadores
  locais** da aba) recebe uma **barra horizontal sob os pés** (16×4) na cor
  selecionada: verde pulsante quando o dash está pronto, amarela preenchendo
  durante o cooldown (`drawDashIndicator`).
- `drawBombTimer()`: **topo central** da tela, fundo escuro com borda branca e
  fonte pixel ("Press Start 2P"). Cor por urgência: verde (>66%), amarelo
  (33–66%), vermelho (≤33%, com pulso de escala).
- `drawParticles()`: desenha `gameState.particles` (as cinzas do dash) com
  transparência conforme a vida.
- `drawStats()`: canto superior esquerdo — **FPS e Ping** — em **caixa
  estática** (`measureText('FPS 999')` e `'Ping 999ms'` calculados uma única
  vez; a largura da caixa **não muda** conforme o texto oscila, só os valores
  mudam; caixa e texto ficam um pouco **mais abaixo** do topo) com cor
  configurável por player.
- `drawTrails()`: desenha o **vento** do pé dos personagens — **quadrados**
  sólidos na cor do personagem (sem borda, sem elipse), alpha máximo 0.35, sobem
  levemente e somem após `TRAIL_LIFE`.

### `src/js/hats.js`
- `HATS`: catálogo com `id` e `name` (primeira opção é `none` = **Vazio**).
  Lista atual inclui: `hollow`, `cap`, `cap-red`, `cap-green`, `cap-colorido`
  (Boné colorido), `cap-p` (Chapéu de detetive, pixel), `scarf` (Cachecol
  vermelho), `scarf-green` (Cachecol verde), `scarf-blue` (Cachecol azul),
  `oculos-soldador`, `crown`, `crown-p`, `party`, `headphones`, `chef`, `spidey`
  (**Homem-aranha**, fantasia de corpo inteiro), `flash` (**Flash**), `plunger`,
  `fuse`, `amongus` (Tripulante), `chicken`, `creeper`, `sans`,
  `cavalheiro` (Cavalheiro Branco), `cavalheiro-negro` (Cavalheiro Negro) e os
  cosméticos temáticos: `cupcake` (Cupcake da Chica com vela acesa),
  `guitarra` (Guitarra do Bonnie, menor e na diagonal do peito),
  `foxy` (FNAF — orelhas de raposa + tapa-olho + focinho com dentes escuros),
  `avatar` (Mestre do ar — tatuagem de **seta azul na testa** apontando
  para baixo, inteiramente sobre a cabeça, sem nada flutuando),
  `miles` (Roupa Miles Morales),
  `venom` (Roupa Venom) e `ironman` (Roupa Homem
  de Ferro). Total: 33 opções (incluindo "Vazio").
- **Pixel art** (`PIXEL_HATS`): definidos por `palette` + `rows` + `cell` (px por
  célula, padrão 3) + `dy` (deslocamento vertical, positivo desce). São eles:
  `cap-p`, `crown-p`.
  - `cap-p`: `cell: 3, dy: -22` → assenta **sobre o topo da cabeça** (o topo do
    boné fica ~22px acima da cabeça e a borda assenta na cabeça). Aba larga: a
    última linha do grid é 1 célula mais larga de cada lado (pontas esquerda e
    direita da aba mais distantes, para fora da cabeça) mantendo a coroa do
    mesmo tamanho.
  - `crown-p`: `cell: 3, dy: -19` → tamanho padrão (não grande), com a borda
    assente **no topo da cabeça** (base em `top+2`; antes ficava sobre o rosto
    com `dy: -2`).
- **Cavalheiro Branco / Negro (`drawOldHornetMask`)**: elmo com ponta
  arredondada no topo, espinhos laterais e costura no centro, **ampliado
  (~1.5×) para cobrir a cabeça do personagem até a boca** (base em `top+27`).
  O Branco usa as cores da Hornet (`#f5f0e6` claro / `#222` escuro); o Negro
  usa o mesmo modelo só invertendo as cores (elmo `#1a1a1f` com detalhes/
  contorno claros `#e8e8e8`).
- **Knight (`hollow`)**: máscara clara que **cobre o rosto inteiro** (não fica
  menor que o personagem), **dois chifres curvados** para fora no topo e dois
  olhos escuros alinhados com os olhos do personagem.
- **Bonés (`cap`, `cap-red`, `cap-green`) e Boné colorido (`cap-colorido`)**:
  mesmo modelo, somente **aumentados (~1.25×)** para não ficarem pequenos na
  cabeça. O colorido divide o domo em painéis arco-íris (helper
  `drawColorfulCap`, com `clip`).
- **Cachecóis (`scarf`, `scarf-green`, `scarf-blue`)**: mesmo modelo ampliado
  (helper `drawScarf`) que agora **envolve o pescoço** do personagem (faixa
  larga na base do corpo, com as duas pontas balançando), em três cores:
  vermelho, verde e azul.
- **Roupas de corpo inteiro:** `spidey` (fantasia do **Homem-aranha** cobrindo
  o corpo todo: torso vermelho com teias radiais + horizontais e **painéis
  azuis laterais**, pernas azuis com **botas vermelhas**, faixa azul no
  quadril, emblema de aranha no peito e olhos brancos grandes), `amongus`/
  Tripulante (macacão na cor do personagem, **alargado para não parecer dentro
  do corpo**, mochila e visor azul claro que acompanha a direção), `sans`
  (moletom azul com capuz/branco, bermuda preta com faixa e pantufas rosa
  **abaixo do rosto** — o rosto do personagem fica visível, sem o círculo
  escuro sobre os olhos, com o **olho azul brilhante apenas no olho direito**).
- **Máscaras:** `chicken` (galinha estilo Hotline Miami — cabeça branca
  **ampliada para não ficar menor que o rosto**, crista vermelha **grudada no
  topo da cabeça**, bico laranja e olhos escuros), `creeper` (boca exata do
  jogo: barra superior + duas pernas formando o "⊓" carrancudo, **ampliada para
  cobrir o corpo inteiro do boneco**).
- **Coroa (`crown`) e Coroa Pixel (`crown-p`)**: modelos mantidos; a coroa
  normal voltou ao tamanho anterior; a pixel ficou no tamanho padrão (cell 3)
  **posicionada na cabeça** (base em `top+2`, não mais sobre o rosto).
- **Chapéu de festa (`party`), Headphones e Chapéu de chef (`chef`)**: modelos
  mantidos, somente **ampliados** para não ficarem pequenos na cabeça.
- `drawHat(ctx, player, hatId)`: desenha o chapéu sobre o personagem (topo,
  direção da face, balanço) — usado dentro do `drawPlayer` para acompanhar a
  animação/squash.
- `drawHatPreview(ctx, hatId)`: preview em canvas 96×96 para o seletor de
  chapéus — usa o **mesmo modelo do jogo** (`PLAYER_WIDTH`×`PLAYER_HEIGHT`,
  40×44, rosto/olhos/boca idênticos ao `drawPlayer`) em pose parada, para que o
  que aparece no seletor seja idêntico ao que aparece em jogo.

### Como "enxergar" as referências de chapéus (método usado pelas IAs)

Ao criar/editar um cosmético temático, a referência é uma **imagem** em
`REFERENCIAS/` e a IA não consegue vê-la diretamente. O método usado foi:

1. **Gerar uma "leitura" da imagem** com um script Python (PIL). O script:
   - redimensiona a imagem para uma grade de largura fixa (**W = 54** células),
     mantendo a proporção;
   - para cada célula imprime um **caractere de brilho** (`@` mais escuro, ` `
     mais claro: `@%#*+=-:. `);
   - sobrepõe a **inicial da cor dominante** da célula (letra maiúscula):
     `R` vermelho, `O` laranja, `Y` amarelo, `G` verde, `C` ciano, `B` azul,
     `P` rosa, `M` magenta/roxo, `K` preto, `b` marrom, `w` branco, `g` cinza;
   - imprime uma **legenda das cores** reais usadas (hex) para copiar tons
     fielmente.
2. **Ler a grade** como se fosse a imagem: cada célula ≈ `largura_da_cabeça / 54`
   unidades no espaço do personagem (a cabeça tem 40px de largura; usar a escala
   `s = h/44` para converter para o tamanho do jogador).
3. **Traduzir** as formas observadas para primitivas de canvas (`rr`, `ellipse`,
   `ellipsePath`, `beginPath` + `quadraticCurveTo`, etc.), preservando
   proporções e cores.

Para reproduzir, o script de exemplo (`imgscan.py`, feito em Python com Pillow):

```python
from PIL import Image
img = Image.open('referencia.png').convert('RGB')
W = 54
H = max(1, round(img.height * W / img.width))
img = img.resize((W, H))
BR = '@%#*+=-:. '
def letter(c):
    r, g, b = c
    if min(r,g,b) > 235: return 'w'
    if max(r,g,b) < 25: return 'K'
    if r>140 and g<90 and b<90: return 'R'
    if r>170 and 90<g<170 and b<90: return 'O'
    if r>170 and g>170 and b<90: return 'Y'
    if r<110 and g>120 and b<110: return 'G'
    if r<120 and g>150 and b>150: return 'C'
    if r<110 and g<120 and b>150: return 'B'
    if r>150 and g<150 and b>150: return 'P'
    if r>110 and g<110 and b>110: return 'M'
    if r>100 and 60<g<120 and b<80: return 'b'
    if r>190 and g>190 and b>190: return 'w'
    return 'g'
seen = set()
for y in range(H):
    line = ''
    for x in range(W):
        r, g, b = img.getpixel((x, y))
        lum = (r+g+b)/3
        ch = BR[min(9, int(lum/255*10))]
        l = letter((r,g,b))
        if l != 'g': ch = l
        seen.add((l, (r,g,b)))
        line += ch
    print(line)
for l, c in sorted(seen):
    print(f'{l} #{c[0]:02x}{c[1]:02x}{c[2]:02x}')
```

Regras de leitura da grade (base do desenho): células `K`/`b` escuras = contorno
e áreas escuras; `w` = rosto/peças claras; uma mancha contígua de `R`/`O`/`P`
= detalhe colorido (crista, língua, enfeite). Sempre que possível, rodar com
diferentes recortes (rosto, topo, corpo) para captar o todo antes de codificar.

### `src/js/ui.js` (DOM/UI)
- `refs`: referências a todos os elementos do HTML.
- **Aba de configurações** (engrenagem ⚙): `toggleSettingsPanel` /
  `closeSettingsPanel` — a engrenagem gira 360° e desliza para o lado enquanto a
  aba abre animada pela direita. Contém cor, chapéu, auto-pass, atalhos,
  FPS/ping, limite de FPS, resolução, volumes e sair da sala.
- **Editor de atalhos:** clicar em um botão de tecla entra em modo "recording";
  a próxima tecla pressionada (ou `Esc` para cancelar) define o atalho.
  `resetCustomKeys` restaura os originais.
- **Seletor de chapéus:** `openHatPicker` — popup com caixinhas em grid com
  preview em canvas; ao escolher, salva no `deviceId` e no player da sala.
  **A localização das regiões do personagem** (constante `CHARACTER_REGIONS` +
  função `drawCharacterRegionsDiagram`) fica **somente no código**, como
  referência para desenvolvimento de cosméticos (não é mais exibida no jogo).
  O diagrama mostra as medidas de cada parte (corpo inteiro, topo da cabeça,
  rosto, olhos, boca, corpo debaixo e pés), com origem no canto superior
  esquerdo do corpo; os cosméticos são desenhados a partir de
  `top = player.y - player.h` (topo do corpo) e `player.x` (centro).
- `showScreen(name)` também **fecha o seletor de chapéus** (além da aba de
  configurações) ao sair da tela de lobby — assim, se o jogo iniciar enquanto
  o jogador estiver na tela de cosméticos, ela é fechada automaticamente.
- **Modal de confirmação:** `showConfirm` / `hideConfirm` — usado para "Sair da
  sala?" e "Voltar para o lobby?".
- **Modal de atribuição de controle (`padModal`):** `showPadConnect(padIndex)` /
  `hidePadConnect()` / `getPadConnectIndex()`. Lista os jogadores locais desta
  tela (atribuir o pad a um deles via `assignPadToPlayer`) ou cria um novo
  jogador (`padCreateBtn` → nome → `handlePadCreate`, que chama
  `rooms.addLocalPlayer` e atribui o pad ao novo player).
- **Modal de convite (`inviteModal`):** `openInviteModal()` / `closeInviteModal()`
  — monta o link `?room=CÓDIGO` e copia para o clipboard.
- **Configuração por jogador:** `getSettingsPlayer()` resolve quem está sendo
  configurado (`configTargetId`, setado pelo dono do pad que abriu a aba). No
  modo Local a aba mostra "Configurações de {nome}" (nome na cor do jogador,
  com "…" se muito longo) e só cor/chapéu (e demais
  preferências) valem para esse jogador.
- **Foco do menu por jogador:** `uiFocusMap` guarda o índice atual de foco de
  **cada jogador local + teclado**; `renderUiFocuses()` aplica a classe
  `.ui-focus` e a cor (`--focus-color`) de cada elemento (removendo destaques
  antigos em toda a página), então dois controles navegam simultaneamente cada
  um com sua cor (fallback `#2ecc40`).
- `showScreen` / `showNotice` / `showLobbyAlert`: troca de telas e avisos.
- `renderLobby()`: lista de jogadores, **seleção de controle por jogador**
  (Teclado/Controle 1–4; editável pelo próprio jogador local ou pelo HOST —
  `canAssign` inclui os jogadores desta tela; impede atribuir o mesmo gamepad a
  dois jogadores e só permite um jogador no teclado — mesma tela = mesmo
  teclado), status de gamepads conectados (lembrete de conectar um controle
  para adicionar jogadores), rótulo **"Você"** para os jogadores locais desta
  tela, badge de pontos (quando > 0), botão **"Convidar"** sempre visível e
  `renderSettings()`.
- `renderSettings()`: sincroniza a aba de configurações com o `localStorage` e
  preenche o **título da aba** (h3 ao lado do botão de fechar) com
  "Configurações de {nome}" — nome na cor do jogador, com "…" se muito longo —
  refletindo **quem abriu** as configurações (`configTargetId`).
- `showResultMessage()`: mostra **somente o placar** com o título
  **"👑 {NOME} VENCEU! 👑"** — nome do vencedor na cor dele — sem classes
  `victory`/`explode`, sem confete e sem
  som de vitória; **`renderScoreboard(result.scoreboard)`** monta o placar
  (1º com coroa 👑, 2º, 3º… nomes **na cor de cada jogador** e "X pts").
- `formatControls()`: legenda de controles (gamepad ou teclado, com atalhos
  efetivos) no HUD do jogo.
- `updateHud()`: **no-op** — os painéis "Partida" e "Você" foram removidos; o
  timer agora é desenhado no canvas.

### `src/js/audio.js`
- Música do menu (aleatória de `musics/menu`) e do jogo (aleatória de
  `musics/game`); troca automática entre telas. Volume respeita a config
  `getMusicVolume` (padrão 70).
- Efeitos: `playClick` (botões, via WebAudio), `playPop`, e `playSound(nome)`
  (agora **async**) que toca um mp3 aleatório do grupo. Grupos definidos em
  `SOUND_GROUPS`: `start-countdown` → `sounds/countdown/countdown.mp3`,
  `start-menu` → `sounds/countdown/start-menu.mp3`, `victory`, `kill` e
  `leaderboard`. Volume respeita `getSfxVolume` (padrão 90).
- **Sons dinâmicos por pasta** (`FOLDER_GROUPS`): `jump` lista os arquivos de
  `sounds/jump/` via `listFolderFiles` (fetch do diretório + cache) e sorteia um
  aleatório; se o servidor não permitir listar, usa `jump1.mp3` como fallback.
  O caminho final é tocado por `playFile`.
- `setMusicVolume`/`setSfxVolume`: aplicam o volume em tempo real nos áudios
  ativos (usado pelos sliders da aba de configurações).
- `unlockAudio()`: inicializa o AudioContext no primeiro clique do usuário.

### `src/js/effects.js`
- `spawnConfetti(n, anchor?)`: cria `n` confetes que caem girando e são
  removidos sozinhos. Se `anchor` for passado (elemento DOM), o confete é
  ancorado no retângulo desse elemento (ex.: o modal de vitória); senão, cai na
  tela toda. Usado ao entrar na sala e ao iniciar a partida.

### `src/js/maps.js`
- `MAPS`: array com 6 definições de mapa, cada uma com `name`, `bg` (cor de
  fundo), `platformColors` (array de cores para as plataformas) e `platforms`
  (array de retângulos `{x, y, width, height}`). Mapas: Clássico, Torres,
  Escadas, Ilhas, Arena, Ziguezague.
- Seleção aleatória sem repetição: o jogo cicla por todos os mapas antes de
  repetir qualquer um.
- Mapas Ilhas e Ziguezague foram redesenhados usando imagens de referência
  (`REFERENCIAS-MAPAS/`) — as posições das plataformas seguem as linhas verdes
  das imagens.

### `src/js/touch.js`
- Controles touch mobile para dispositivos com tela sensível ao toque.
- **Dois estilos:**
  - **Setas** (`arrows`): botões de seta esquerda/direita + botões de ação
    (JUMP, DASH).
  - **Joystick analógico** (`analog`): stick virtual + botões de ação.
- **Editor de layout:** `openLayoutEditor()` abre um editor onde cada botão é
  arrastável (drag-and-drop). As posições são salvas como porcentagens
  (`DEFAULT_TOUCH_LAYOUT`) e persistidas no `localStorage`.
- **Visibilidade:** `updateTouchVisibility()` mostra os controles apenas na tela
  de jogo quando o round está ativo e o player tem touch habilitado.
- Cada botão usa `setTouchInput(action, bool)` do `input.js` para publicar
  input. O joystick analógico converte posição X em left/right.

### `src/js/donate.js`
- Modal de doação PIX. Botão `donateBox` abre o modal (`donateModal`).
- Exibe um campo de texto com o código PIX copia-e-cola e um botão "Copiar
  código PIX" que usa `navigator.clipboard.writeText` (com fallback para
  `execCommand`).
- `updateDonateVisibility()`: oculta o botão de doação durante partidas quando
  o player tem controles touch habilitados (para não atrapalhar o jogo).

---

## 5. Fluxo de dados (resumo)

1. **Salas** → `rooms.js` + `storage.js` (`bombPartyRoomsV1`; cada player tem
   `deviceId` e `hat`; a sala tem `mode`).
2. **Input** → cada aba publica o input do SEU player em
   `bombPartyInput_<playerId>` (teclado com atalhos efetivos + gamepad).
3. **Simulação (HOST)** → `game.js` lê os inputs (`getPlayerKeys`), calcula o
   estado em passos fixos de 1/60s, e publica em `bombPartyGame_<codigoDaSala>`
   a cada ~33ms (com `rev` e `t`).
4. **Clientes** → `clientRenderLoop` lê `bombPartyGame_<código>` e desenha.
5. **Configurações por player** → `bombPartyAutoPass_<id>`,
   `bombPartyGamepad_<id>`, `bombPartyFpsEnabled_<id>`,
   `bombPartyFpsColor_<id>`, `bombPartyFpsLimit_<id>`,
   `bombPartyResolution_<id>`, `bombPartyKeys_<id>`,
   `bombPartyTouchEnabled_<id>`, `bombPartyTouchStyle_<id>`,
   `bombPartyTouchLayout_<id>`.
6. **Por dispositivo** → `bombPartyDeviceId`, `bombPartyHat_<deviceId>`.
7. **Globais** → `bombPartyMusicVolume`, `bombPartySfxVolume`,
   `bombPartyPixPresets`.

## 6. Chaves do `localStorage`

| Chave                        | Conteúdo                                          |
|------------------------------|---------------------------------------------------|
| `bombPartyRoomsV1`           | Array de salas com jogadores (cada player tem `deviceId` e `hat`; a sala tem `mode`; jogadores locais têm `local: true`) |
| `bombPartyRoom`              | (sessionStorage) código da minha sala              |
| `bombPartyPlayerId`          | (sessionStorage) meu playerId                      |
| `bombPartyLocalPlayers`      | (sessionStorage) array com os playerIds controlados por esta aba (modo Local) |
| `bombPartyInput_<id>`        | Último input publicado por um jogador              |
| `bombPartyGame_<código>`     | Estado atual da partida (publicado pelo host; inclui `roundResult` ao fim) |
| `bombPartyAutoPass_<id>`     | "1"/"0" — passar bomba automaticamente             |
| `bombPartyGamepad_<id>`      | Índice do gamepad (-1 = teclado)                   |
| `bombPartyFpsEnabled_<id>`   | "1"/"0" — mostrar FPS/ping                         |
| `bombPartyFpsColor_<id>`     | Cor hex do overlay de FPS/ping                     |
| `bombPartyFpsLimit_<id>`     | Limite de FPS (0 = sem limite, senão 5–240)        |
| `bombPartyResolution_<id>`   | Escala de resolução (0.05–1, padrão 1)             |
| `bombPartyKeys_<id>`         | JSON com atalhos customizados (`left/right/jump/pass/dash`) |
| `bombPartyDeviceId`          | UUID persistente do navegador (para salvar chapéu) |
| `bombPartyHat_<deviceId>`    | Id do chapéu escolhido (padrão `none`)             |
| `bombPartyTouchEnabled_<id>` | "1"/"0" — controles touch habilitados              |
| `bombPartyTouchStyle_<id>`   | Estilo do touch: "arrows" ou "analog"              |
| `bombPartyTouchLayout_<id>`  | JSON com posições dos botões touch (porcentagens)   |
| `bombPartyMusicVolume`       | Volume da música (0–100, padrão 70)                |
| `bombPartySfxVolume`         | Volume dos efeitos (0–100, padrão 90)              |
| `bombPartyPixPresets`        | Presets de valores PIX separados por vírgula       |

## 7. Pontos de atenção ao mexer no código

- **Partículas:** ficam em `state.gameState.particles` (o desenho lê de lá).
- **Fim de rodada:** `endRound` grava `gs.roundResult` (com `winnerId`,
  `loserId`, `loserName`) **antes** de publicar, para os clientes mostrarem o
  resultado. `gameLoop` e `becomeSimulator` checam o `roundResult` do estado
  compartilhado e param de simular (evita double-sim apagando o fim da rodada).
- **`becomeSimulator`:** qualquer jogador pode assumir a simulação se o host
  parar de publicar — não confundir com quem é o host real.
- **Bomba:** o timer **não soma +2s** ao passar (mudança recente). Existe
  `passCooldown` (0.6s) no alvo para a troca ser visível.
- **Fixed timestep:** a simulação avança em passos de 1/60s com acumulador — não
  usar dt variável do RAF para a física, senão o jogo fica dependente do FPS.
- **Limite de FPS / resolução:** são por player e leem do `localStorage`; o
  limite só pula frames de desenho (a física continua em tempo real). A
  resolução só muda o backing store do canvas (espaço lógico sempre 1080×540).
- **Placar de pontos:** `awardRoundPoints` roda no `finalizeRound` (host) e dá
  pontos distintos por posição (1º vencedor). `player.score` persiste na sala e
  entra no `roomSignature` (mudanças de pontos sincronizam entre abas).
- **Aviso de desconexão em jogo:** quando um jogador sai ou cai (aba fechada)
  durante a partida, os demais veem um alerta "X saiu" dentro do canvas
  (`#gameAlerts`), tanto via evento `storage` quanto via `cleanupStalePlayers`.
- **Atalhos customizados:** `getEffectiveControls` sempre resolve os efetivos
  (custom sobre padrão). Novos atalhos devem seguir o mesmo formato de chave.
- **Chapéu:** é salvo por `deviceId` (persistente) e também gravado no player da
  sala para todos os tabs verem. `roomSignature` inclui `hat` e `mode`.
- **Gamepad:** a atribuição é por playerId e armazenada por aba; o input lê o
  gamepad do player atribuído e mescla com o teclado. **Menus:** `getUiPad` só
  devolve um gamepad atribuído a um player **desta aba** (`localPlayerIds`) —
  não usar `connectedGamepads()[0]`, senão o controle age em todas as abas.
- **Jogadores locais (`localPlayerIds`):** cada aba controla vários players
  (host no teclado + jogadores via pads). Sempre sincronizar via
  `saveLocalPlayers()` ao criar/entrar/adicionar/sair; `heartbeat` e `leaveRoom`
  tratam **todos** os locais. A aba de configurações edita o `configTargetId`
  (dono do pad que abriu).
- **Confirmações:** qualquer saída (sala/lobby) deve passar por `showConfirm`
  para manter o padrão da UI.

## 8. Ideias futuras (já anotadas no projeto)

- Editor de mapas com importador/exportador (na tela inicial, não no lobby).
- Variedade de mapas diferentes escolhidos aleatoriamente a cada partida.
- Modo de jogo "CORRA!" (um player é um monstro que persegue os demais).
- Suporte a dispositivos móveis com botões visuais personalizáveis (estilos de
  setas/analógico, posições editáveis, reset).
- Timer de 7 segundos ao iniciar o jogo (estilo Gartic Phone).
