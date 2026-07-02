import * as vscode from 'vscode';
import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { SpotifyPlaylistProvider } from '../providers/playlistProvider';

export function authenticateSpotify(context: vscode.ExtensionContext, playlistProvider: SpotifyPlaylistProvider) {
    const clientId = 'da282d8bd0f441d7bd7468f6f3b0f440';
    const clientSecret = 'a0add161a55a4cb487f14b7f65f34d19';

    const redirectUri = 'http://[::1]:8888/callback';
    const scopes = encodeURIComponent('user-read-playback-state user-modify-playback-state playlist-read-private');

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

    const server = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url || '', true);

        if (parsedUrl.pathname === '/callback') {
            const code = parsedUrl.query.code as string;
            const error = parsedUrl.query.error;

            if (error) {
                const errorHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Erro · Spotify Player</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#f0f0f5;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}div{max-width:400px;padding:40px}.icon{font-size:3rem;margin-bottom:16px}h1{font-size:1.5rem;font-weight:800;margin-bottom:12px;color:#ff5f57}p{color:#8888a0;line-height:1.6}</style></head><body><div><div class="icon">&#9888;</div><h1>Autorizacao cancelada</h1><p>Voce cancelou a conexao com o Spotify. Pode fechar esta aba e tentar novamente no VS Code.</p></div></body></html>`;
                res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(errorHtml);
                vscode.window.showErrorMessage('Login do Spotify cancelado.');
            } else if (code) {
                const indexPath = path.join(context.extensionPath, 'index.html');
                fs.readFile(indexPath, 'utf-8', (readErr, indexHtml) => {
                    if (readErr) {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>Spotify conectado com sucesso!</h1><p>Voce ja pode fechar esta janela e voltar para o VS Code.</p>');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(indexHtml);
                    }
                });

                try {
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
                        vscode.window.showInformationMessage('Spotify conectado com sucesso!');
                        playlistProvider.isLoggedIn = true;
                        playlistProvider.refresh();
                    } else {
                        vscode.window.showErrorMessage('Falha ao gerar o token. Verifique seu Client Secret.');
                        console.error(tokenData);
                    }
                } catch (e) {
                    vscode.window.showErrorMessage('Erro de conexão ao tentar gerar o token.');
                }
            }
            server.close();
        }
    });

    server.listen(8888, () => {
        vscode.env.openExternal(vscode.Uri.parse(authUrl));
        vscode.window.showInformationMessage(
            'Caso você não seja redirecionado automaticamente, cole este link no seu navegador.',
            'Copiar Link'
        ).then(selection => {
            if (selection === 'Copiar Link') {
                vscode.env.clipboard.writeText(authUrl);
                vscode.window.showInformationMessage('Link copiado para a área de transferência!');
            }
        });
    });
}
