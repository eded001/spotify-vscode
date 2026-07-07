import * as vscode from 'vscode';
import { authenticateSpotify } from '../auth/spotifyAuth';
import { SpotifyPlaylistProvider } from '../providers/playlistProvider';
import { SpotifyBaseClient } from '../api/spotifyBaseClient';
import { logger } from '../logger';

/**
 * Registra o comando `spotify-player.login` no VS Code.
 * Esse comando dispara o fluxo de autenticação com o Spotify.
 * 
 * @param context O contexto da extensão para adicionar a inscrição do comando.
 * @param spotifyClient O cliente da API do Spotify para obter e persistir credenciais.
 * @param playlistProvider O provedor de playlists para atualização de dados na interface.
 */
export function registerLoginCommand(
    context: vscode.ExtensionContext,
    spotifyClient: SpotifyBaseClient,
    playlistProvider: SpotifyPlaylistProvider
) {
    let cmdLogin = vscode.commands.registerCommand('spotify-player.login', () => {
        logger.info('Comando spotify-player.login executado pelo usuário.');
        authenticateSpotify(context, spotifyClient, playlistProvider);
    });

    context.subscriptions.push(cmdLogin);
    logger.info('Comando spotify-player.login registrado com sucesso.');
}
