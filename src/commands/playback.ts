import * as vscode from 'vscode';
import { StatusBarItems } from '../ui/statusBar';
import { SpotifyBaseClient } from '../api/spotifyBaseClient';
import { playSpotify, pauseSpotify, nextSpotify, previousSpotify } from '../api/spotifyPlayback';
import { logger } from '../logger';

/**
 * Registra os comandos relacionados ao controle de reprodução de música:
 * - `spotify-player.play`: Alterna entre tocar e pausar a música atual.
 * - `spotify-player.next`: Avança para a próxima música.
 * - `spotify-player.previous`: Retorna para a música anterior.
 * 
 * @param context O contexto da extensão para gerenciar inscrições de comandos.
 * @param statusBarItems Os botões da barra de status para atualizar seu texto e ícone de forma reativa.
 * @param spotifyClient O cliente da API do Spotify para envio dos comandos de reprodução.
 */
export function registerPlaybackCommands(
    context: vscode.ExtensionContext,
    statusBarItems: StatusBarItems,
    spotifyClient: SpotifyBaseClient
) {
    const { playPauseBtn, songInfo } = statusBarItems;

    let cmdPlay = vscode.commands.registerCommand('spotify-player.play', async () => {
        logger.info('Comando spotify-player.play executado.');
        try {
            if (playPauseBtn.text === '$(play)') {
                logger.info('Solicitando início de reprodução (Play)...');
                await playSpotify(spotifyClient);
                playPauseBtn.text = '$(debug-pause)';
                songInfo.text = '$(music) Tocando...';
                vscode.window.showInformationMessage('Spotify: Tocando...');
                logger.info('Reprodução iniciada com sucesso. UI atualizada para Tocando.');
            } else {
                logger.info('Solicitando pausa de reprodução (Pause)...');
                await pauseSpotify(spotifyClient);
                playPauseBtn.text = '$(play)';
                songInfo.text = '$(music) Pausado';
                vscode.window.showInformationMessage('Spotify: Pausado.');
                logger.info('Reprodução pausada com sucesso. UI atualizada para Pausado.');
            }
        } catch (error: any) {
            logger.error(`Erro ao controlar reprodução (Play/Pause): ${error.message}`, error);
            vscode.window.showErrorMessage(`Erro ao controlar reprodução: ${error.message}. Certifique-se de que o Spotify está aberto em algum dispositivo.`);
        }
    });

    let cmdNext = vscode.commands.registerCommand('spotify-player.next', async () => {
        logger.info('Comando spotify-player.next executado. Solicitando avançar música...');
        try {
            await nextSpotify(spotifyClient);
            vscode.window.showInformationMessage('Spotify: Pulando para a próxima música...');
            logger.info('Música avançada com sucesso.');
        } catch (error: any) {
            logger.error(`Erro ao avançar música: ${error.message}`, error);
            vscode.window.showErrorMessage(`Erro ao pular música: ${error.message}`);
        }
    });

    let cmdPrev = vscode.commands.registerCommand('spotify-player.previous', async () => {
        logger.info('Comando spotify-player.previous executado. Solicitando voltar música...');
        try {
            await previousSpotify(spotifyClient);
            vscode.window.showInformationMessage('Spotify: Voltando para a música anterior...');
            logger.info('Música voltada com sucesso.');
        } catch (error: any) {
            logger.error(`Erro ao voltar música: ${error.message}`, error);
            vscode.window.showErrorMessage(`Erro ao voltar música: ${error.message}`);
        }
    });

    context.subscriptions.push(cmdPlay, cmdNext, cmdPrev);
    logger.info('Comandos de reprodução registrados com sucesso.');
}
