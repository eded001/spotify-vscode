# Spotify Player for VS Code

Extensão em **TypeScript** que integra a Spotify Web API ao Visual Studio Code, permitindo visualizar playlists e controlar a reprodução sem sair do editor.

## Features

- mini-player em Webview;
- playlists na Activity Bar;
- play/pause, próxima e anterior;
- informações da faixa atual;
- comandos pela Command Palette;
- autenticação OAuth 2.0 com PKCE;
- armazenamento seguro de tokens usando os secrets do VS Code.

## Stack

- TypeScript
- VS Code Extension API
- Spotify Web API
- OAuth 2.0 + PKCE
- Node.js
- esbuild

## Uso

1. Instale a extensão em ambiente de desenvolvimento.
2. Abra a área **Spotify** na Activity Bar.
3. Execute **Spotify: Vincular conta**.
4. Autorize o acesso no navegador.
5. Mantenha um dispositivo Spotify ativo para controlar a reprodução.

> O controle de reprodução pela Spotify Web API exige conta Spotify Premium.

## Comandos

| Comando | Ação |
|---|---|
| `Spotify: Vincular conta` | inicia autenticação |
| `Spotify: Tocar/Pausar` | alterna reprodução |
| `Spotify: Próxima Música` | avança a faixa |
| `Spotify: Música Anterior` | volta a faixa |
| `Atualizar Playlists` | recarrega playlists |

## Desenvolvimento

```bash
npm install
npm run compile
```

Outros scripts úteis:

```bash
npm run watch
npm run lint
npm run test
npm run package
```

## Requisitos

- VS Code compatível com a versão definida em `engines.vscode`;
- conta Spotify;
- dispositivo ativo para comandos de reprodução.

## Observação

A extensão utiliza APIs oficiais do Spotify e do VS Code. O projeto tem foco em integração de APIs, OAuth, experiência de desenvolvedor e extensão da interface do editor.
