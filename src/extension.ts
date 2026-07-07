import * as vscode from 'vscode';
import { setupStatusBar } from './ui/statusBar';
import { SpotifyPlaylistProvider } from './providers/playlistProvider';
import { SpotifyPlayerProvider } from './providers/playerProvider';
import { SpotifyBaseClient } from './api/spotifyBaseClient';
import { registerAllCommands } from './commands';
import { logger } from './logger';
import { playSpotify } from './api/spotifyPlayback';

/**
 * Ativa a extensão Spotify Player para o VS Code.
 * Inicializa o logger, o cliente da API do Spotify, os controles da barra de status,
 * os provedores da barra lateral (playlists e webview do player) e registra os comandos associados.
 * 
 * @param context O contexto da extensão fornecido pelo VS Code.
 */
export async function activate(context: vscode.ExtensionContext) {
    // Inicializar o Logger antes de qualquer outra ação
    logger.initialize();
    logger.info('Iniciando ativação da extensão "spotify-player"...');

    // 1. Inicializar o cliente da API do Spotify
    const spotifyClient = new SpotifyBaseClient(context);
    await spotifyClient.initialize();

    // 2. Configurar a Barra de Status
    const statusBarItems = setupStatusBar(context);

    // 3. Registrar os provedores de dados para a Barra Lateral
    const playlistProvider = new SpotifyPlaylistProvider(spotifyClient);
    vscode.window.registerTreeDataProvider('spotify-player.playlists', playlistProvider);
    logger.info('TreeDataProvider spotify-player.playlists registrado com sucesso.');

    const playerProvider = new SpotifyPlayerProvider(context.extensionUri, spotifyClient, statusBarItems);
    vscode.window.registerWebviewViewProvider('spotify-player.player', playerProvider);
    logger.info('WebviewViewProvider spotify-player.player registrado com sucesso.');

    // 4. Registrar comando para tocar uma playlist
    const playPlaylistCmd = vscode.commands.registerCommand('spotify-player.playPlaylist', async (playlistUri: string, playlistName: string) => {
        logger.info(`Comando spotify-player.playPlaylist executado para a playlist: ${playlistName} (${playlistUri})`);
        try {
            await playSpotify(spotifyClient, playlistUri);
            statusBarItems.playPauseBtn.text = '$(debug-pause)';
            statusBarItems.songInfo.text = `$(music) Playlist: ${playlistName}`;
            vscode.window.showInformationMessage(`Spotify: Tocando playlist "${playlistName}"`);
        } catch (error: any) {
            logger.error(`Erro ao tocar playlist ${playlistName}: ${error.message}`, error);
            vscode.window.showErrorMessage(`Erro ao tocar playlist: ${error.message}. Certifique-se de que o Spotify está aberto.`);
        }
    });
    context.subscriptions.push(playPlaylistCmd);

    // Registrar comando para atualizar playlists
    const refreshPlaylistsCmd = vscode.commands.registerCommand('spotify-player.refreshPlaylists', () => {
        logger.info('Comando spotify-player.refreshPlaylists executado.');
        playlistProvider.refresh();
    });
    context.subscriptions.push(refreshPlaylistsCmd);

    // 5. Registrar todos os comandos
    registerAllCommands(context, statusBarItems, spotifyClient, playlistProvider);
    logger.info('Extensão "spotify-player" ativada com sucesso!');
}

/**
 * Desativa a extensão Spotify Player para o VS Code.
 * Executa as rotinas de limpeza e loga a desativação da extensão.
 */
export function deactivate() {
    logger.info('Extensão "spotify-player" desativada.');
}
