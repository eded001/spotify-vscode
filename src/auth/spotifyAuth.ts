import * as vscode from 'vscode';
import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { SpotifyPlaylistProvider } from '../providers/playlistProvider';
import { SpotifyBaseClient } from '../api/spotifyBaseClient';
import { logger } from '../logger';

/**
 * Inicia o fluxo de autenticação OAuth2 (Authorization Code Flow) com o Spotify.
 * 
 * Cria um servidor HTTP local temporário na porta 8888 escutando em [::1] (IPv6 loopback),
 * abre o navegador do usuário direcionando-o para a página de login do Spotify
 * e, após receber o callback contendo o código de autorização, faz a requisição POST
 * para obter os tokens de acesso e atualização (refresh token).
 * Os tokens obtidos são armazenados com segurança e a barra lateral de playlists é atualizada.
 * 
 * @param context O contexto da extensão para acessar os caminhos dos arquivos locais e segredos.
 * @param spotifyClient O cliente base para definir os novos tokens obtidos.
 * @param playlistProvider O provedor de dados das playlists para atualizar a interface gráfica.
 */
export function authenticateSpotify(
    context: vscode.ExtensionContext,
    spotifyClient: SpotifyBaseClient,
    playlistProvider: SpotifyPlaylistProvider
) {
    logger.info('Iniciando o fluxo de autenticação do Spotify...');
    const clientId = 'da282d8bd0f441d7bd7468f6f3b0f440';
    const clientSecret = 'a0add161a55a4cb487f14b7f65f34d19';

    const redirectUri = 'http://[::1]:8888/callback';
    const scopes = encodeURIComponent('user-read-playback-state user-modify-playback-state playlist-read-private user-library-read');

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

    const server = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url || '', true);
        logger.info(`Servidor HTTP recebeu requisição para a rota: ${parsedUrl.pathname}`);

        if (parsedUrl.pathname === '/callback') {
            const code = parsedUrl.query.code as string;
            const error = parsedUrl.query.error;

            if (error) {
                logger.warn(`Erro retornado na URL de callback do Spotify: ${error}`);
                const errorHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Erro · Spotify Player</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#f0f0f5;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}div{max-width:400px;padding:40px}.icon{font-size:3rem;margin-bottom:16px}h1{font-size:1.5rem;font-weight:800;margin-bottom:12px;color:#ff5f57}p{color:#8888a0;line-height:1.6}</style></head><body><div><div class="icon">&#9888;</div><h1>Autorizacao cancelada</h1><p>Voce cancelou a conexao com o Spotify. Pode fechar esta aba e tentar novamente no VS Code.</p></div></body></html>`;
                res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(errorHtml);
                vscode.window.showErrorMessage('Login do Spotify cancelado.');
            } else if (code) {
                logger.info('Código de autorização recebido do Spotify callback. Lendo arquivo index.html local para resposta...');
                const indexPath = path.join(context.extensionPath, 'index.html');
                fs.readFile(indexPath, 'utf-8', (readErr, indexHtml) => {
                    if (readErr) {
                        logger.error('Erro ao ler index.html local. Enviando resposta padrão em texto plano.', readErr);
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>Spotify conectado com sucesso!</h1><p>Voce ja pode fechar esta janela e voltar para o VS Code.</p>');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(indexHtml);
                    }
                });

                try {
                    logger.info('Efetuando requisição POST para a API do Spotify para obter tokens de acesso...');
                    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
                        },
                        body: new URLSearchParams({
                            code: code,
                            redirect_uri: redirectUri,
                            grant_type: 'authorization_code'
                        }).toString()
                    });

                    const tokenData = await tokenResponse.json() as any;

                    if (tokenData.access_token) {
                        logger.info('Tokens obtidos com sucesso. Atualizando credenciais no SpotifyBaseClient...');
                        await spotifyClient.setTokens(
                            tokenData.access_token,
                            tokenData.refresh_token || '',
                            tokenData.expires_in || 3600
                        );
                        logger.info('Tokens persistidos com sucesso.');
                        vscode.window.showInformationMessage('Spotify conectado com sucesso!');
                        playlistProvider.refresh();
                    } else {
                        logger.error('Falha ao gerar o token de acesso. A API do Spotify não retornou um access_token.', tokenData);
                        vscode.window.showErrorMessage('Falha ao gerar o token. Verifique seu Client Secret.');
                    }
                } catch (e) {
                    logger.error('Erro de conexão ao tentar gerar o token.', e);
                    vscode.window.showErrorMessage('Erro de conexão ao tentar gerar o token.');
                }
            }
            logger.info('Fechando o servidor HTTP de callback local...');
            clearTimeout(timeout);
            server.close();
        }
    });

    const timeout = setTimeout(() => {
        logger.warn('Tempo limite de login expirado (5 minutos). Fechando o servidor local...');
        server.close();
    }, 5 * 60 * 1000);

    server.on('error', (err: any) => {
        logger.error(`Erro no servidor HTTP local: ${err.message}`, err);
        clearTimeout(timeout);
        if (err.code === 'EADDRINUSE') {
            vscode.window.showErrorMessage('Erro ao iniciar o servidor de login: A porta 8888 já está em uso.');
        } else {
            vscode.window.showErrorMessage(`Erro no servidor de autenticação: ${err.message}`);
        }
    });

    server.listen(8888, '::1', () => {
        logger.info('Servidor local escutando na porta 8888 em [::1]. Redirecionando usuário para o navegador...');
        vscode.env.openExternal(vscode.Uri.parse(authUrl));
        vscode.window.showInformationMessage(
            'Caso você não seja redirecionado automaticamente, cole este link no seu navegador.',
            'Copiar Link'
        ).then(selection => {
            if (selection === 'Copiar Link') {
                vscode.env.clipboard.writeText(authUrl);
                logger.info('O usuário clicou em "Copiar Link". URL de autorização copiada para o clipboard.');
                vscode.window.showInformationMessage('Link copiado para a área de transferência!');
            }
        });
    });
}
