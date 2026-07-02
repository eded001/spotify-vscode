import * as vscode from 'vscode';

export interface StatusBarItems {
    previousBtn: vscode.StatusBarItem;
    playPauseBtn: vscode.StatusBarItem;
    nextBtn: vscode.StatusBarItem;
    songInfo: vscode.StatusBarItem;
}

export function setupStatusBar(context: vscode.ExtensionContext): StatusBarItems {
    const previousBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 102);
    previousBtn.text = '$(chevron-left)';
    previousBtn.tooltip = 'Música Anterior';
    previousBtn.command = 'spotify-player.previous';
    previousBtn.show();

    const playPauseBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 101);
    playPauseBtn.text = '$(play)';
    playPauseBtn.tooltip = 'Tocar/Pausar';
    playPauseBtn.command = 'spotify-player.play';
    playPauseBtn.show();

    const nextBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    nextBtn.text = '$(chevron-right)';
    nextBtn.tooltip = 'Próxima Música';
    nextBtn.command = 'spotify-player.next';
    nextBtn.show();

    const songInfo = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    songInfo.text = '$(music) Nenhuma música';
    songInfo.tooltip = 'Status do Spotify';
    songInfo.show();

    context.subscriptions.push(previousBtn, playPauseBtn, nextBtn, songInfo);

    return { previousBtn, playPauseBtn, nextBtn, songInfo };
}
