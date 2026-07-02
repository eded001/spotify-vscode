import * as vscode from 'vscode';
import { StatusBarItems } from '../ui/statusBar';
import { SpotifyPlaylistProvider } from '../providers/playlistProvider';
import { registerPlaybackCommands } from './playback';
import { registerLoginCommand } from './login';

export function registerAllCommands(
    context: vscode.ExtensionContext,
    statusBarItems: StatusBarItems,
    playlistProvider: SpotifyPlaylistProvider
) {
    registerPlaybackCommands(context, statusBarItems);
    registerLoginCommand(context, playlistProvider);
}
