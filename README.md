<p align="center">
  <img src="https://raw.githubusercontent.com/eded001/spotify-vscode/main/media/logo.png" width="120" alt="Spotify Logo">
</p>

<h1 align="center">Spotify Player para VS Code</h1>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://custom-icon-badges.demolab.com/badge/Visual%20Studio%20Code-0078d7.svg?logo=visualstudiocode&logoColor=white" alt="VS Code API" />
  <img src="https://img.shields.io/badge/Spotify_Web_API-1ED760?style=flat&logo=spotify&logoColor=white" alt="Spotify Web API" />
</p>

**Spotify Player** é uma extensão para o Visual Studio Code que integra perfeitamente sua conta do Spotify ao seu ambiente de desenvolvimento. Controle suas músicas e navegue por suas playlists sem precisar sair do editor ou interromper seu fluxo de trabalho.

---

## ✨ Funcionalidades (Features)

- 🎵 **Mini-Player na Barra Lateral**: Uma Webview interativa exibindo a arte do álbum, progresso atual da música em tempo real e controles rápidos (Anterior, Play/Pause, Próxima).
- 📋 **Navegador de Playlists**: Visualize suas playlists públicas e privadas do Spotify na barra lateral. Um clique inicia a playlist escolhida.
- ⚡ **Controles na Barra de Status**: Botões discretos e informativos no rodapé do VS Code mostrando a música atual e oferecendo controles de mídia rápidos.
- 🔒 **Login Seguro**: Autenticação oficial OAuth2 via fluxo Authorization Code com PKCE, salvando seus tokens de forma criptografada nos segredos do VS Code.

---

## 🚀 Como Usar (Getting Started)

1. Após instalar a extensão, clique no ícone do **Spotify** na Barra de Atividades (Activity Bar) do VS Code.
2. Na aba **Playlists**, clique em **Conectar ao Spotify** (ou abra a Paleta de Comandos com `Ctrl+Shift+P` / `Cmd+Shift+P` e digite `Spotify: Vincular conta`).
3. Seu navegador padrão será aberto para autorizar a extensão a se conectar ao Spotify.
4. Após a confirmação de conexão bem-sucedida, você já pode fechar a janela do navegador.
5. Certifique-se de que o aplicativo oficial do Spotify (Desktop, Web ou Mobile) esteja **aberto e ativo** em segundo plano e comece a controlar suas faixas pelo VS Code!

---

## 🛠️ Requisitos (Requirements)

- **Spotify Premium**: Devido a restrições e limitações impostas pela API oficial Web API do Spotify, as ações de controle de reprodução (tocar, pausar, avançar e voltar música) exigem uma conta **Spotify Premium**.
- **Dispositivo Ativo**: O Spotify exige que haja um player ativo conectado para receber comandos remotamente. Abra o Spotify em seu computador ou smartphone e reproduza uma música antes de utilizar os botões da extensão.

---

## 💻 Comandos Disponíveis

Você pode disparar as seguintes ações pela Paleta de Comandos do VS Code (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Comando                    | Descrição                                                     |
| :------------------------- | :------------------------------------------------------------ |
| `Spotify: Vincular conta`  | Inicia o fluxo de login no navegador para conectar sua conta. |
| `Spotify: Tocar/Pausar`    | Inicia ou pausa a reprodução da faixa atual.                  |
| `Spotify: Próxima Música`  | Avança para a próxima música na fila.                         |
| `Spotify: Música Anterior` | Volta para a música anterior na fila.                         |
| `Atualizar Playlists`      | Atualiza a lista de playlists exibidas na barra lateral.      |

---

## ⚠️ Problemas Conhecidos (Known Issues)

- **Erro "No active device found"**: Ocorre se você não tiver o Spotify aberto em nenhum dispositivo ou se o Spotify tiver colocado o dispositivo em modo de suspensão. Abra o aplicativo do Spotify e inicie a reprodução de uma música para reativar o player.
- **Limites de Requisição (Rate Limiting)**: A atualização rápida de músicas pode esbarrar nos limites da API do Spotify. O mini-player atualiza o status de reprodução a cada 3 segundos para evitar bloqueios.
