import * as vscode from 'vscode';
import { logger } from '../logger';

/**
 * Interface contendo as referências para os botões de controle e
 * exibição de informações de reprodução na barra de status do VS Code.
 */
export interface StatusBarItems {
    /** Botão para voltar música (Previous). */
    previousBtn: vscode.StatusBarItem;
    /** Botão para iniciar ou pausar música (Play/Pause). */
    playPauseBtn: vscode.StatusBarItem;
    /** Botão para avançar música (Next). */
    nextBtn: vscode.StatusBarItem;
    /** Texto informativo com o nome da música e do artista atual. */
    songInfo: vscode.StatusBarItem;
}

/**
 * Inicializa, estiliza e exibe os botões de controle de reprodução e o painel de status
 * na barra de status do VS Code (canto esquerdo).
 * Adiciona todos os botões criados nas inscrições (subscriptions) da extensão para descarte limpo.
 * 
 * @param context O contexto da extensão.
 * @returns Um objeto `StatusBarItems` com as instâncias criadas.
 */
export function setupStatusBar(context: vscode.ExtensionContext): StatusBarItems {
    logger.info('Configurando elementos da Barra de Status...');
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

    logger.info('Elementos da Barra de Status criados e registrados.');
    return { previousBtn, playPauseBtn, nextBtn, songInfo };
}
