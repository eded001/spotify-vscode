import * as vscode from 'vscode';
import { StatusBarItems } from '../ui/statusBar';

export function registerPlaybackCommands(context: vscode.ExtensionContext, statusBarItems: StatusBarItems) {
    const { playPauseBtn, songInfo } = statusBarItems;

    let cmdPlay = vscode.commands.registerCommand('spotify-player.play', () => {
        if (playPauseBtn.text === '$(play)') {
            playPauseBtn.text = '$(debug-pause)';
            songInfo.text = '$(music) Linkin Park - In The End';
            vscode.window.showInformationMessage('Spotify: Tocando...');
        } else {
            playPauseBtn.text = '$(play)';
            songInfo.text = '$(music) Pausado';
            vscode.window.showInformationMessage('Spotify: Pausado.');
        }
    });

    let cmdNext = vscode.commands.registerCommand('spotify-player.next', () => {
        vscode.window.showInformationMessage('Spotify: Pulando para a próxima música...');
    });

    let cmdPrev = vscode.commands.registerCommand('spotify-player.previous', () => {
        vscode.window.showInformationMessage('Spotify: Voltando para a música anterior...');
    });

    context.subscriptions.push(cmdPlay, cmdNext, cmdPrev);
}
