# 🚀 Como hospedar o PartyGame com o online funcionando

Este guia mostra, passo a passo, como colocar o jogo no ar para que amigos
joguem de **celular ou PC**, cada um na sua casa, na mesma sala.

Existem 3 caminhos. Recomendamos o **Caminho 1** (tudo em um serviço só,
grátis).

---

## Caminho 1 — Render.com (RECOMENDADO: site + online juntos)

O nosso servidor (`server/server.js`) já entrega os arquivos do jogo **e**
mantém o online. Um único serviço resolve tudo.

### Parte A — Colocar o projeto no GitHub (uma vez só)

1. Crie uma conta em **https://github.com** (Sign up), se ainda não tiver.
2. Baixe e instale o **GitHub Desktop**: https://desktop.github.com
   (abra, faça login com a conta criada).
3. No navegador, acesse github.com, clique no **+** (canto superior direito)
   → **New repository**:
   - Repository name: `bombparty`
   - Marque **Public**
   - NÃO marque "Add a README"
   - Clique em **Create repository**
4. Volte ao **GitHub Desktop** → menu **File → Clone Repository** → aba
   **GitHub.com** → escolha `seuusuario/bombparty` → escolha uma pasta local
   (ex.: `Documentos\bombparty`) → **Clone**.
5. Abra a pasta clonada no Explorador de Arquivos e copie para dentro dela
   **TODO o conteúdo** da pasta do jogo (`index.html`, pasta `src/`, `musics/`,
   `sounds/`, `server/`, etc.), com UM cuidado:
   - ⚠️ **NÃO copie a pasta `server\node_modules`** (ela é reconstruída
     automaticamente pelo servidor). Se aparecer, apague antes de enviar.
6. No GitHub Desktop, os arquivos vão aparecer listados à esquerda. Escreva um
   resumo (ex.: `Primeira versão do jogo`) → botão **Commit to main** → depois
   **Publish repository** (confirme que está público) → **Push origin**.

### Parte B — Criar o servidor no Render

1. Acesse **https://render.com** → **Get Started** → entre com a sua conta
   **GitHub** (autorize o acesso).
2. No painel, clique em **New +** (canto superior direito) → **Web Service**.
3. Clique em **Build and deploy from a Git repository** → **Connect GitHub** →
   escolha o repositório `bombparty`.
4. Preencha a tela de configuração:
   - **Name:** `bombparty` (vira parte do endereço)
   - **Language:** Node
   - **Branch:** `main`
   - **Region:** a mais próxima (Ohio/Frankfurt…)
   - **Root Directory:** `server` ← MUITO IMPORTANTE (é a pasta do servidor)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free**
5. Clique em **Create Web Service** e aguarde o build (~2 minutos).
6. No topo da página aparece o endereço do seu jogo, algo como
   **https://bombparty.onrender.com** — pronto! Esse link JÁ É O JOGO ONLINE.
7. Teste: abra o link no seu celular, crie a sala; no PC do amigo, abra o mesmo
   link e entre com o código. 🎉

### Coisas que você vai querer saber

| Situação | O que acontece |
|---|---|
| Plano Free fica ocioso ~15 min | O primeiro acesso demora ~50 s para "acordar" o servidor. Depois volta ao normal. |
| Atualizar o jogo | Edite os arquivos na pasta clonada → GitHub Desktop → Commit → **Push origin**. O Render publica sozinho. |
| Link de convite do lobby | Já funciona: leva o amigo direto para a sala. |
| Quiser domínio próprio | Render → Settings → Custom Domains. |

---

## Caminho 2 — Netlify (site) + Render (online)

Se quiser manter o jogo também no Netlify (carrega rápido, CDN):

1. Siga as Partes A e B do Caminho 1 (o Render precisa existir de qualquer
   forma — ele é quem faz o online).
2. Acesse **https://app.netlify.com** → entre (pode ser com GitHub) →
   na aba **Sites**, arraste a **pasta do projeto** para a área
   *"Drag and drop your site output folder here"* (use a opção
   "deploy manually"). O Netlify gera algo como
   `https://seusite.netlify.app`.
3. Para o online funcionar pelo Netlify, os jogadores devem abrir o site com
   `?srv=` apontando para o servidor do Render:
   ```
   https://seusite.netlify.app/?srv=https://bombparty.onrender.com
   ```
   - Use esse endereço (com `?srv=`) ao criar/entrar nas salas.
   - Os **links de convite** gerados no lobby já incluem o `?srv=`
     automaticamente — quem receber joga sem configurar nada.
   - O valor fica salvo no navegador (`bombPartyServerUrl`); dá para limpar
     abrindo o site com `?net=0` e depois removendo manualmente, ou simplesmente
     usando sempre o link com `?srv=`.

> Resumo: o Netlify sozinho serve o jogo, mas quem garante o multiplayer entre
> dispositivos é o servidor do Render. Na dúvida, use apenas o Caminho 1.

---

## Caminho 3 — Rápido, da sua própria máquina (para testar/festa)

1. Abra o **PowerShell** na pasta do projeto:
   `cd caminho\do\PartyGame\server`
2. `npm install` (só na primeira vez) e depois `npm start`.
3. Amigos na **mesma rede Wi-Fi**: descubra seu IP com `ipconfig`
   (procure "Endereço IPv4") e compartilhe `http://SEU-IP:3000`.
4. Amigos fora da rede: instale o **cloudflared** e rode
   `cloudflared tunnel --url http://localhost:3000` — ele mostra um link
   público tipo `https://algo.trycloudflare.com` que já funciona com WebSocket.

---

## Problemas comuns

| Problema | Solução |
|---|---|
| "Sala não encontrada" ao entrar | Espere 1–2 s e tente entrar de novo (o estado da sala está chegando do servidor). |
| Jogador entrou mas não vê a partida iniciar | Verifique se todos abriram o MESMO endereço (mesmo `?srv=` quando aplicável). |
| Render deu erro no deploy | Confira **Root Directory = server** e se `server/package.json` foi enviado ao GitHub. |
| Som não toca no celular | Toque uma vez na tela (navegadores só liberam áudio após interação). |
