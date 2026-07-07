import * as vscode from 'vscode';
import { SpotifyBaseClient } from '../api/spotifyBaseClient';
import { getCurrentPlayback } from '../api/spotifyPlayerState';
import { playSpotify } from '../api/spotifyPlayback';
import { logger } from '../logger';
import { StatusBarItems } from '../ui/statusBar';

/**
 * Provedor de visualização em Webview (WebviewViewProvider) para o mini-player do Spotify.
 * Renderiza uma interface HTML interativa na barra lateral que exibe informações da música,
 * controles de reprodução (Anterior, Play/Pause, Próxima) e uma barra de busca integrada.
 */
export class SpotifyPlayerProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private interval?: NodeJS.Timeout;

    /**
     * Cria uma instância de SpotifyPlayerProvider.
     * 
     * @param _extensionUri O URI base do diretório da extensão.
     * @param spotifyClient O cliente base da API do Spotify para requisições autenticadas.
     * @param statusBarItems Os itens da barra de status para sincronização de estado visual.
     */
    constructor(
        private readonly _extensionUri: vscode.Uri,
        private spotifyClient: SpotifyBaseClient,
        private statusBarItems: StatusBarItems
    ) { }

    /**
     * Resolve a visualização em Webview (configura opções, carrega HTML e registra listeners).
     * 
     * @param webviewView O painel da Webview sendo criado/resolvido.
     * @param context O contexto de resolução da Webview.
     * @param _token Token de cancelamento de operação.
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview();

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.command) {
                case 'play':
                case 'pause':
                    vscode.commands.executeCommand('spotify-player.play');
                    setTimeout(() => this.updatePlayer(), 500);
                    break;
                case 'next':
                    vscode.commands.executeCommand('spotify-player.next');
                    setTimeout(() => this.updatePlayer(), 500);
                    break;
                case 'previous':
                    vscode.commands.executeCommand('spotify-player.previous');
                    setTimeout(() => this.updatePlayer(), 500);
                    break;
                case 'login':
                    vscode.commands.executeCommand('spotify-player.login');
                    break;
            }
        });

        this.updatePlayer();
        this.interval = setInterval(() => this.updatePlayer(), 3000);

        webviewView.onDidDispose(() => {
            if (this.interval) {
                clearInterval(this.interval);
            }
        });
    }

    /**
     * Atualiza o estado visual do mini-player na Webview consultando a API de estado de reprodução.
     * Também sincroniza as atualizações reativas na barra de status do VS Code.
     */
    private async updatePlayer() {
        if (!this._view) {
            return;
        }

        const loggedIn = await this.spotifyClient.hasValidToken();
        if (!loggedIn) {
            this._view.webview.postMessage({ command: 'update', state: null, disconnected: true });
            
            // clock status bar items to play icon when disconnected
            this.statusBarItems.playPauseBtn.text = '$(play)';
            this.statusBarItems.songInfo.text = '$(music) Desconectado';
            return;
        }

        const state = await getCurrentPlayback(this.spotifyClient);
        this._view.webview.postMessage({ command: 'update', state });

        // Update status bar dynamically
        if (state && state.item) {
            this.statusBarItems.playPauseBtn.text = state.is_playing ? '$(debug-pause)' : '$(play)';
            const artistNames = state.item.artists ? state.item.artists.map(a => a.name).join(', ') : 'Artista Desconhecido';
            const songName = state.item.name || 'Sem nome';
            this.statusBarItems.songInfo.text = `$(music) ${songName} - ${artistNames}`;
        } else {
            this.statusBarItems.playPauseBtn.text = '$(play)';
            this.statusBarItems.songInfo.text = '$(music) Nenhuma música';
        }
    }

    /**
     * Retorna a estrutura de marcação HTML e estilos CSS incorporados da Webview.
     * Define o layout responsivo, cores sincronizadas com o tema do VS Code,
     * e o código JavaScript frontend com o controle de eventos e timers.
     * 
     * @returns A string contendo a estrutura de documento HTML da Webview.
     */
    private _getHtmlForWebview() {
        return `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Spotify Player</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-editor-foreground);
                        padding: 10px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .player-container {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }
                    img.album-art {
                        width: 200px;
                        height: 200px;
                        object-fit: cover;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    }
                    .song-info {
                        margin-bottom: 15px;
                        width: 100%;
                    }
                    .song-name {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 0 0 5px 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .artist-name {
                        font-size: 13px;
                        opacity: 0.8;
                        margin: 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .progress-container {
                        width: 100%;
                        margin-bottom: 15px;
                    }
                    .progress-bar {
                        width: 100%;
                        height: 4px;
                        background-color: var(--vscode-editorWidget-background);
                        border-radius: 2px;
                        overflow: hidden;
                        margin-bottom: 5px;
                    }
                    .progress-fill {
                        height: 100%;
                        background-color: var(--vscode-textLink-foreground);
                        width: 0%;
                        transition: width 1s linear;
                    }
                    .time-info {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        opacity: 0.7;
                    }
                    .controls {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    button {
                        background: none;
                        border: none;
                        color: var(--vscode-editor-foreground);
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    button:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }
                    button svg {
                        width: 24px;
                        height: 24px;
                        fill: currentColor;
                    }
                    button.play-pause svg {
                        width: 32px;
                        height: 32px;
                    }
                    .empty-state {
                        opacity: 0.7;
                        text-align: center;
                        margin-top: 50px;
                    }
                </style>
            </head>
            <body>
                <div id="player-panel">
                    <div class="empty-state">Carregando player...</div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const playerPanel = document.getElementById('player-panel');

                    let currentProgressMs = 0;
                    let currentDurationMs = 0;
                    let isPlaying = false;
                    let localProgressInterval = null;


                    function formatTime(ms) {
                        if (!ms) return '0:00';
                        const totalSeconds = Math.floor(ms / 1000);
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;
                        return \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                    }

                    function updateProgressUI() {
                        if (!currentDurationMs) return;
                        
                        const progressFill = document.getElementById('progress-fill');
                        const timeCurrent = document.getElementById('time-current');
                        
                        if (progressFill && timeCurrent) {
                            const percent = (currentProgressMs / currentDurationMs) * 100;
                            progressFill.style.width = \`\${Math.min(percent, 100)}%\`;
                            timeCurrent.textContent = formatTime(currentProgressMs);
                        }
                    }

                    function startLocalProgress() {
                        if (localProgressInterval) clearInterval(localProgressInterval);
                        if (isPlaying) {
                            localProgressInterval = setInterval(() => {
                                currentProgressMs += 1000;
                                if (currentProgressMs > currentDurationMs) currentProgressMs = currentDurationMs;
                                updateProgressUI();
                            }, 1000);
                        }
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;

                        if (message.command === 'update') {
                            const state = message.state;
                            
                            if (localProgressInterval) {
                                clearInterval(localProgressInterval);
                            }

                            if (message.disconnected) {
                                playerPanel.innerHTML = \`
                                    <div class="empty-state">
                                        <p style="margin-bottom: 16px;">Para controlar a música, conecte sua conta do Spotify.</p>
                                        <button onclick="sendCommand('login')" style="background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;border-radius:4px;padding:8px 16px;cursor:pointer;font-family:inherit;font-weight:600;margin:10px auto;display:block;">Conectar ao Spotify</button>
                                    </div>
                                \`;
                                return;
                            }

                            if (!state || !state.item) {
                                playerPanel.innerHTML = '<div class="empty-state">Nenhuma música tocando no momento.</div>';
                                return;
                            }

                            const item = state.item;
                            const albumArtUrl = item.album && item.album.images && item.album.images.length > 0 ? item.album.images[0].url : '';
                            const songName = item.name;
                            const artistName = item.artists && item.artists.length > 0 ? item.artists.map(a => a.name).join(', ') : 'Artista Desconhecido';
                            
                            isPlaying = state.is_playing;
                            currentProgressMs = state.progress_ms;
                            currentDurationMs = item.duration_ms;

                            playerPanel.innerHTML = \`
                                <div class="player-container">
                                    \${albumArtUrl ? \`<img src="\${albumArtUrl}" class="album-art" alt="Album Art">\` : ''}
                                    <div class="song-info">
                                        <p class="song-name" title="\${songName}">\${songName}</p>
                                        <p class="artist-name" title="\${artistName}">\${artistName}</p>
                                    </div>
                                    <div class="progress-container">
                                        <div class="progress-bar">
                                            <div id="progress-fill" class="progress-fill"></div>
                                        </div>
                                        <div class="time-info">
                                            <span id="time-current">0:00</span>
                                            <span>\${formatTime(currentDurationMs)}</span>
                                        </div>
                                    </div>
                                    <div class="controls">
                                        <button onclick="sendCommand('previous')" title="Anterior">
                                            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                                        </button>
                                        <button class="play-pause" onclick="sendCommand('\${isPlaying ? 'pause' : 'play'}')" title="\${isPlaying ? 'Pausar' : 'Tocar'}">
                                            \${isPlaying 
                                                ? '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' 
                                                : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'}
                                        </button>
                                        <button onclick="sendCommand('next')" title="Próxima">
                                            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                                        </button>
                                    </div>
                                </div>
                            \`;

                            updateProgressUI();
                            startLocalProgress();
                        }
                    });

                    function sendCommand(command) {
                        vscode.postMessage({ command });
                    }


                </script>
            </body>
            </html>`;
    }
}
