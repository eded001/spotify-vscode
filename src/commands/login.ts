import * as vscode from 'vscode';
import { authenticateSpotify } from '../auth/spotifyAuth';
import { SpotifyPlaylistProvider } from '../providers/playlistProvider';

export function registerLoginCommand(context: vscode.ExtensionContext, playlistProvider: SpotifyPlaylistProvider) {
    let cmdLogin = vscode.commands.registerCommand('spotify-player.login', () => {
        authenticateSpotify(context, playlistProvider);
    });

    context.subscriptions.push(cmdLogin);
}
