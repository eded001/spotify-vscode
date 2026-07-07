import * as vscode from 'vscode';
import { StatusBarItems } from '../ui/statusBar';
import { SpotifyPlaylistProvider } from '../providers/playlistProvider';
import { SpotifyBaseClient } from '../api/spotifyBaseClient';
import { registerPlaybackCommands } from './playback';
import { registerLoginCommand } from './login';

/**
 * Registra todos os comandos expostos pela extensão no VS Code.
 * Centraliza a ativação dos comandos de controle de reprodução e login.
 * 
 * @param context O contexto da extensão.
 * @param statusBarItems Os botões e elementos informativos da barra de status.
 * @param spotifyClient O cliente de comunicação com a API do Spotify.
 * @param playlistProvider O provedor de dados das playlists para a barra lateral.
 */
export function registerAllCommands(
    context: vscode.ExtensionContext,
    statusBarItems: StatusBarItems,
    spotifyClient: SpotifyBaseClient,
    playlistProvider: SpotifyPlaylistProvider
) {
    registerPlaybackCommands(context, statusBarItems, spotifyClient);
    registerLoginCommand(context, spotifyClient, playlistProvider);
}
