# Cosméticos Customizados - Guia Completo

## Visão Geral

O sistema de cosméticos permite criar, editar e usar cosméticos visuais nos personagens. Existem dois tipos:

1. **Imagem** — Upload de arquivo de imagem (PNG, JPG, SVG, GIF)
2. **Código** — Código JavaScript que desenha o cosmético diretamente no personagem

Os cosméticos são visíveis para todos os jogadores na mesma sala.

---

## Como Acessar

1. Entre em uma sala (crie ou entre)
2. Abra as **Configurações** (botão ⚙ no lobby)
3. Na seção **Aparência**, clique em **"Gerenciar cosméticos"**

---

## Criar Cosmético por Imagem

1. Clique em **"+ Imagem"**
2. Selecione um arquivo de imagem do seu computador
3. A imagem será redimensionada automaticamente para no máximo 128x128 pixels
4. O cosmético será criado e equipado automaticamente
5. O **editor de posição** abrirá para posicionar o cosmético no personagem

### Restrições de Imagem

- Formatos aceitos: PNG, JPG, SVG, GIF
- Tamanho máximo: 200KB
- Resolução máxima: 128x128 pixels (redimensionado automaticamente)

---

## Criar Cosmético por Código

1. Clique em **"+ Código"**
2. Cole o código JavaScript na caixa de texto
3. O preview será atualizado em tempo real
4. Clique em **"Salvar"**

### API de Desenho

O código tem acesso a estas variáveis:

```javascript
// ctx — Contexto do canvas (CanvasRenderingContext2D)
// w   — Largura do personagem (40)
// h   — Altura do personagem (44)
// color — Cor do personagem (hex, ex: "#ff6b6b")
// time  — Tempo do jogo em segundos (para animações)
// player — Objeto com dados do personagem:
//   player.x       — Posição X no canvas
//   player.y       — Posição Y no canvas (pé do personagem)
//   player.vx      — Velocidade horizontal
//   player.vy      — Velocidade vertical
//   player.onGround — Está no chão (boolean)
//   player.alive   — Está vivo (boolean)
//   player.hasBomb — Está com a bomba (boolean)
```

### Exemplos de Código

#### Barba simples
```javascript
function draw(ctx, w, h, color, time, player) {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(w * 0.2, h * 0.6, w * 0.6, h * 0.2);
}
```

#### Asas animadas
```javascript
function draw(ctx, w, h, color, time, player) {
  const wingFlap = Math.sin(time * 8) * 0.3;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  // Asa esquerda
  ctx.save();
  ctx.translate(w * 0.1, h * 0.4);
  ctx.rotate(-0.5 + wingFlap);
  ctx.fillRect(-15, -3, 15, 6);
  ctx.restore();
  // Asa direita
  ctx.save();
  ctx.translate(w * 0.9, h * 0.4);
  ctx.rotate(0.5 - wingFlap);
  ctx.fillRect(0, -3, 15, 6);
  ctx.restore();
}
```

#### Brilho pulsante
```javascript
function draw(ctx, w, h, color, time, player) {
  const pulse = 0.3 + Math.sin(time * 4) * 0.2;
  ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.6, 0, Math.PI * 2);
  ctx.fill();
}
```

#### Reação à bomba
```javascript
function draw(ctx, w, h, color, time, player) {
  if (player.hasBomb) {
    const shake = Math.sin(time * 20) * 2;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(w * 0.1 + shake, 0, w * 0.8, h * 0.15);
  }
}
```

---

## Posicionar Cosmético

Ao equipar um cosmético (ou clicar "Equipar" na lista), o **editor de posição** abre:

1. **Arrastar** — Clique e arrastie o cosmético no personagem para mover
2. **Escala** — Use o slider para ajustar o tamanho (0.5x a 3.0x)
3. **Salvar** — Confirma a posição
4. **Cancelar** — Descarta as alterações

A posição ésalva como offset (X, Y) em relação ao canto superior esquerdo do personagem.

---

## Equipar e Remover

- **Equipar** — Adiciona o cosmético ao personagem (máximo 5 por jogador)
- **Remover** — Remove o cosmético do personagem (mantém na lista de criados)
- **Excluir** — Remove permanentemente o cosmético

---

## Limitações

- **Máximo de cosméticos por jogador:** 5
- **Tamanho por cosmético:** 200KB (imagens)
- **Resolução de imagem:** 128x128px máximo
- **Cross-device:** Cosméticos não sincronizam entre máquinas diferentes (usando localStorage)
- **Performance:** Mantenha o código simples para 60fps

---

## Arquitetura Técnica

```
Room State (publicado a cada 33ms)
└── player.cosmetics = [{ id, offsetX, offsetY, scale }]
    (leve — só referências)

Cosmetics Store (localStorage separado)
└── { "uuid": { id, name, type, data/code, ... } }
    (pesado — imagens, código)

Image Cache (em memória)
└── state.cosmeticsCache = Map<id, Image>
    (pré-carregado para performance)
```

- Dados pesados (imagens/código) ficam fora do loop principal de game state
- Sincronização entre abas via evento `storage` no localStorage
- Imagens são pré-carregadas como objetos `Image` para evitar recomposição
