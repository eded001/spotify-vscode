import * as vscode from 'vscode';
import { setupStatusBar } from './ui/statusBar';
import { SpotifyPlaylistProvider } from './providers/playlistProvider';
import { registerAllCommands } from './commands';

export function activate(context: vscode.ExtensionContext) {
    console.log('A extensão "spotify-player" está ativa!');

    // 1. Configurar a Barra de Status
    const statusBarItems = setupStatusBar(context);

    // 2. Registrar o provedor de dados para a Barra Lateral
    const playlistProvider = new SpotifyPlaylistProvider();
    vscode.window.registerTreeDataProvider('spotify-player.playlists', playlistProvider);

    // 3. Registrar todos os comandos
    registerAllCommands(context, statusBarItems, playlistProvider);
}

export function deactivate() {}
