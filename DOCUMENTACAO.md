# Bomb Party — Documentação do Projeto

> **Objetivo deste arquivo:** explicar o que é o projeto, como funciona e para que
> serve cada pasta/arquivo, para que uma IA (ou outro desenvolvedor) entenda o
> código sem precisar ler linha por linha.

---

## 1. O que é o projeto

**Bomb Party** é um jogo de plataforma multiplayer **local** (roda em um único
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
- Dois modos de partida ao criar a sala: **Online** (uma tela por player) e
  **Multijogador local** (uma tela só, com overlay de FPS/ping desativado).
- Chapéus personalizados (persistidos por navegador via `deviceId`).
- Timer da bomba no **topo central** da tela em fonte pixel, com cores por
  urgência (verde → amarelo → vermelho pulsante).
- Indicador visual do seu personagem (borda pulsante + sublinhado na cor
  escolhida).

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
1. Na primeira aba, escolha o **modo** (Online / Multijogador local) e crie uma
   sala (vira HOST).
2. Nas outras, entrem com o código da sala.
3. No lobby, cada um escolhe seu controle (Teclado / Controle 1–4) e pode abrir
   a engrenagem ⚙ para ajustar cor, chapéu, atalhos, FPS, resolução e volume.
4. O HOST clica em "Iniciar partida".

**Importante:** como usa `localStorage`, todos os jogadores devem estar no
mesmo navegador e na mesma origem. Não funciona entre máquinas diferentes
(arquitetura atual).

---

## 3. Estrutura de pastas e arquivos

```
BombParty/
├── index.html              → Estrutura HTML das telas (welcome, lobby, game) + popups/modal
├── IDEIAS-APLICACOES.txt   → Lista de ideias pedidas já implementadas e futuras
├── JOGOS-REFERENCIA.txt    → Jogos usados como referência visual/sonora
├── src/
│   ├── css/
│   │   └── style.css       → Todos os estilos (cartões, aba de configs, chapéus, modal, confete)
│   ├── Images/
│   │   └── BombGame/
│   │       └── bomb.png    → Sprite da bomba
│   └── js/
│       ├── main.js         → Ponto de entrada: orquestra tudo, loops, eventos, transições
│       ├── constants.js    → Constantes de jogo (física, timer, teclas, prefixos de storage)
│       ├── state.js        → Estado global compartilhado + helpers (getMyPlayer, isHost)
│       ├── storage.js      → Camada de leitura/escrita do localStorage
│       ├── rooms.js        → Salas, jogadores, host, modo, heartbeat, limpeza de inativos
│       ├── input.js        → Input de teclado/gamepad; publicação por playerId; atalhos custom
│       ├── game.js         → Simulação da partida (física, bomba, colisões, partículas)
│       ├── render.js       → Desenho no canvas (personagens, timer, chapéus, FPS/ping)
│       ├── hats.js         → Catálogo e desenho dos chapéus (canvas) + previews
│       ├── ui.js           → DOM/UI: lobby, aba de configs, seleção de chapéu, modal de confirmação
│       ├── audio.js        → Música (menu/jogo) e efeitos (WebAudio + mp3), com volumes
│       └── effects.js      → Confetes (efeitos visuais DOM, ancoráveis a um elemento)
├── musics/
│   ├── menu/               → Música do menu (menu1.mp3 … menu5.mp3)
│   ├── game/               → Música da partida (gm1.mp3 … gm11.mp3)
│   └── game-RUN/           → Reservado para futuro modo "CORRA!" (gmr1.mp3)
└── sounds/
    ├── jump/               → Sons de pulo
    ├── kill/               → Sons de explosão/morte
    ├── leaderboard/        → Sons de placar
    ├── start-countdown/    → Sons de contagem regressiva
    └── victory/            → Sons de vitória
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
  durante o jogo (botão ✕) passam por um modal de confirmação.
- Intervals: `heartbeat` (mantém jogador vivo), `cleanupStalePlayers`
  (remove inativos), publicação de input.

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
    `getHat`/`saveHat`.
  - Globais: `getMusicVolume`/`setMusicVolume`, `getSfxVolume`/`setSfxVolume`
    (0–100, padrão 70 e 90).

### `src/js/rooms.js`
- Criação/entrada em salas, geração de código (`randomCode`) e cor (`randomColor`).
- `createRoom(nickname, maxPlayers, mode)`: `mode` é `'online'` (padrão) ou
  `'local'`. Cada jogador recebe `deviceId` (do navegador) e `hat` salvo.
- `leaveRoom` / `removePlayerFromRoom`: remoção com **transferência de host**
  (o primeiro jogador restante vira host).
- `startGame`: valida (só host, mínimo 2 jogadores) e marca `room.started`.
- `heartbeat`: atualiza `lastSeen` de cada jogador a cada ~2s.
- `cleanupStalePlayers`: remove jogadores inativos (8s), transfere host e
  **retorna** `{ dropped, removedPlayers }` para a UI exibir alertas de saída
  detectados localmente (sem depender de evento `storage`).
- `roomSignature`: assinatura da sala (inclui `mode` e `hat` de cada player)
  usada para detectar mudanças entre abas.

### `src/js/input.js`
- `getEffectiveControls(playerId)`: retorna os atalhos **efetivos** de um player
  (atos customizados via `bombPartyKeys_<id>` sobrepostos ao `controlSets`
  padrão).
- `publishMyInput()`: monta o objeto de teclas (esquerda/direita/pular/passar/
  dash) do **meu** player — teclado (com atalhos efetivos) + gamepad (se
  atribuído) — e grava no `localStorage`.
- `getPlayerKeys(player)`: lê o input de qualquer player (usado pelo host na
  simulação).
- `readGamepad`/`connectedGamepads`: Gamepad API. Mapeamento do controle:
  - Mover: analógico esquerdo (ou direcional)
  - Pular: botão **A** (ou direcional para cima)
  - Passar: botão **X** (ou **Y**)
  - Dash: **RT** (ou **B**)
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
- `spawnDashParticles`: cria as partículas cinzas do dash (sobem, somem).

### `src/js/render.js` (desenho no canvas)
- `drawScene()`: fundo, plataformas, partículas, personagens (com chapéu),
  bombas, dash indicator, **timer central** e overlay de FPS/ping.
- `setResolutionScale(scale)`: o canvas é desenhado sempre no espaço lógico
  **1080×540**; a escala só muda o tamanho do backing store (`setTransform`).
- `drawPlayer()`: personagens estilo **PICO PARK** (corpo redondo, pés, olhos,
  boca) com **animação ao andar** (pés balançam + corpo quica) e **ao pular**
  (corpo estica, pés recolhidos). O **seu** personagem recebe uma borda pulsante
  + sublinhado na cor selecionada (`player.id === state.myPlayerId`).
- `drawBombTimer()`: **topo central** da tela, fundo escuro com borda branca e
  fonte pixel ("Press Start 2P"). Cor por urgência: verde (>66%), amarelo
  (33–66%), vermelho (≤33%, com pulso de escala).
- `drawParticles()`: desenha `gameState.particles` (as cinzas do dash) com
  transparência conforme a vida.
- `drawStats()`: canto superior esquerdo — **FPS e Ping** — com cor configurável
  por player. **Oculto no modo `local`** (`room.mode === 'local'`).

### `src/js/hats.js`
- `HATS`: catálogo com `id` e `name` (primeira opção é `none` = **Vazio**).
- `drawHat(ctx, player, hatId)`: desenha o chapéu sobre o personagem (topo,
  direção da face, balanço) — usado dentro do `drawPlayer` para acompanhar a
  animação/squash.
- `drawHatPreview(ctx, hatId)`: mini personagem + chapéu em canvas 96×96 para o
  seletor de chapéus.

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
- **Modal de confirmação:** `showConfirm` / `hideConfirm` — usado para "Sair da
  sala?" e "Voltar para o lobby?".
- `showScreen` / `showNotice` / `showLobbyAlert`: troca de telas e avisos.
- `renderLobby()`: lista de jogadores, **seleção de controle por jogador**
  (Teclado/Controle 1–4; editável pelo próprio jogador ou pelo HOST), status de
  gamepads conectados, modo da sala e `renderSettings()`.
- `renderSettings()`: sincroniza a aba de configurações com o `localStorage`.
- `showResultMessage()`: **personaliza por jogador** — se `result.winnerId ===
  meu id` mostra vitória com coroa 👑 (tema dourado + confete ancorado + som de
  vitória); senão mostra a tela de explosão.
- `formatControls()`: legenda de controles (gamepad ou teclado, com atalhos
  efetivos) no HUD do jogo.
- `updateHud()`: **no-op** — os painéis "Partida" e "Você" foram removidos; o
  timer agora é desenhado no canvas.

### `src/js/audio.js`
- Música do menu (aleatória de `musics/menu`) e do jogo (aleatória de
  `musics/game`); troca automática entre telas. Volume respeita a config
  `getMusicVolume` (padrão 70).
- Efeitos: `playClick` (botões, via WebAudio), `playPop`, e `playSound(nome)`
  que toca um mp3 aleatório do grupo (`start-countdown`, `victory`, `kill`,
  `jump`, `leaderboard`). Volume respeita `getSfxVolume` (padrão 90).
- `setMusicVolume`/`setSfxVolume`: aplicam o volume em tempo real nos áudios
  ativos (usado pelos sliders da aba de configurações).
- `unlockAudio()`: inicializa o AudioContext no primeiro clique do usuário.

### `src/js/effects.js`
- `spawnConfetti(n, anchor?)`: cria `n` confetes que caem girando e são
  removidos sozinhos. Se `anchor` for passado (elemento DOM), o confete é
  ancorado no retângulo desse elemento (ex.: o modal de vitória); senão, cai na
  tela toda. Usado ao entrar na sala e ao iniciar a partida.

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
   `bombPartyResolution_<id>`, `bombPartyKeys_<id>`.
6. **Por dispositivo** → `bombPartyDeviceId`, `bombPartyHat_<deviceId>`.
7. **Globais** → `bombPartyMusicVolume`, `bombPartySfxVolume`.

## 6. Chaves do `localStorage`

| Chave                        | Conteúdo                                          |
|------------------------------|---------------------------------------------------|
| `bombPartyRoomsV1`           | Array de salas com jogadores (cada player tem `deviceId` e `hat`; a sala tem `mode`) |
| `bombPartyRoom`              | (sessionStorage) código da minha sala              |
| `bombPartyPlayerId`          | (sessionStorage) meu playerId                      |
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
| `bombPartyMusicVolume`       | Volume da música (0–100, padrão 70)                |
| `bombPartySfxVolume`         | Volume dos efeitos (0–100, padrão 90)              |

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
- **Modo local:** `room.mode === 'local'` oculta o overlay de FPS/ping. O modo
  é definido na criação da sala e não muda depois.
- **Atalhos customizados:** `getEffectiveControls` sempre resolve os efetivos
  (custom sobre padrão). Novos atalhos devem seguir o mesmo formato de chave.
- **Chapéu:** é salvo por `deviceId` (persistente) e também gravado no player da
  sala para todos os tabs verem. `roomSignature` inclui `hat` e `mode`.
- **Gamepad:** a atribuição é por playerId e armazenada por aba; o input lê o
  gamepad do player atribuído e mescla com o teclado.
- **Confirmações:** qualquer saída (sala/lobby) deve passar por `showConfirm`
  para manter o padrão da UI.

## 8. Ideias futuras (já anotadas no projeto)

- Editor de mapas com importador/exportador (na tela inicial, não no lobby).
- Variedade de mapas diferentes escolhidos aleatoriamente a cada partida.
- Modo de jogo "CORRA!" (um player é um monstro que persegue os demais).
- Placar de pontuação com pódio (coroa no 1º lugar, ordem conforme nº de players).
- Suporte a dispositivos móveis com botões visuais personalizáveis (estilos de
  setas/analógico, posições editáveis, reset).
- Timer de 7 segundos ao iniciar o jogo (estilo Gartic Phone).
