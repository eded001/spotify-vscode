import * as vscode from 'vscode';
import * as http from 'http';
import * as url from 'url';

export function activate(context: vscode.ExtensionContext) {
	console.log('A extensão "spotify-player" está ativa!');

	// 1. Criar itens na Barra de Status (Status Bar)
	// O número (ex: 102) é a prioridade. Quanto maior, mais à esquerda ele fica dentro do alinhamento.

	const previousBtn = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 102);
	previousBtn.text = '$(chevron-left)'; // Nomes de ícones nativos do VS Code (Codicons)
	previousBtn.tooltip = 'Música Anterior';
	previousBtn.command = 'spotify-player.previous'; // Comando executado ao clicar
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

	// 2. Registrar a lógica (Comandos) que acontece quando clicamos nos botões
	let cmdPlay = vscode.commands.registerCommand('spotify-player.play', () => {
		// Mock (Simulação): Se estava "$(play)", mudamos para pausa e alteramos o nome da música
		if (playPauseBtn.text === '$(play)') {
			playPauseBtn.text = '$(debug-pause)';
			songInfo.text = '$(music) Linkin Park - In The End'; // Nome de música fictício
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

	// 3. Registrar o provedor de dados para a nossa Barra Lateral (Tree View)
	const playlistProvider = new SpotifyPlaylistProvider();
	vscode.window.registerTreeDataProvider('spotify-player.playlists', playlistProvider);

	let cmdLogin = vscode.commands.registerCommand('spotify-player.login', () => {
		// Substitua pelos seus dados reais do Spotify Developer Dashboard
		const clientId = 'da282d8bd0f441d7bd7468f6f3b0f440';
		const clientSecret = 'a0add161a55a4cb487f14b7f65f34d19';

		const redirectUri = 'http://[::1]:8888/callback';
		const scopes = encodeURIComponent('user-read-playback-state user-modify-playback-state playlist-read-private');

		const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

		// 1. Levantamos um servidor local na porta 8888 invisível
		const server = http.createServer(async (req, res) => {
			// 3. O navegador chamará este servidor na volta do Spotify
			const parsedUrl = url.parse(req.url || '', true);

			if (parsedUrl.pathname === '/callback') {
				const code = parsedUrl.query.code as string;
				const error = parsedUrl.query.error;

				if (error) {
					res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
					res.end('<h1>Erro no login</h1><p>Você cancelou a autorização. Pode fechar esta aba.</p>');
					vscode.window.showErrorMessage('Login do Spotify cancelado.');
				} else if (code) {
					// Dá uma resposta amigável para o navegador do usuário
					res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
					res.end('<h1>Spotify conectado com sucesso!</h1><p>Você já pode fechar esta janela e voltar para o VS Code.</p>');

					// 4. Aqui está o pote de ouro: pegamos o 'code' e pedimos o Access Token!
					try {
						const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/x-www-form-urlencoded',
								// O Spotify exige que ClientID e ClientSecret sejam enviados em Base64
								'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
							},
							body: new URLSearchParams({
								code: code,
								redirect_uri: redirectUri,
								grant_type: 'authorization_code'
							}).toString()
						});

						const tokenData = await tokenResponse.json();

						if (tokenData.access_token) {
							vscode.window.showInformationMessage('Spotify conectado com sucesso!');
							// Guardaríamos o tokenData.access_token aqui para as próximas requisições.

							// Atualiza a tela da Barra Lateral
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

				// 5. O servidor já cumpriu seu papel, podemos desligá-lo!
				server.close();
			}
		});

		// Coloca o servidor para rodar
		server.listen(8888, () => {
			// Tenta abrir o navegador externo automaticamente
			vscode.env.openExternal(vscode.Uri.parse(authUrl));
			
			// Exibe a notificação de fallback caso o navegador bloqueie a abertura automática
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
	});

	// 4. Adicionar tudo aos 'subscriptions' do contexto (para limpeza ao desativar a extensão)
	context.subscriptions.push(
		previousBtn,
		playPauseBtn,
		nextBtn,
		songInfo,
		cmdPlay,
		cmdNext,
		cmdPrev,
		cmdLogin
	);
}

export function deactivate() {}

// --- CLASSES AUXILIARES PARA A BARRA LATERAL ---

// Esta classe diz ao VS Code o que mostrar dentro da nossa aba "Minhas Playlists"
class SpotifyPlaylistProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	// Ferramenta nativa do VS Code para notificar que a lista precisa ser redesenhada
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	public isLoggedIn: boolean = false; // Estado simulado

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		if (!this.isLoggedIn) {
			// Se retornar vazio e houver um "viewsWelcome" configurado,
			// o VS Code mostra o botão de conectar a conta.
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve([]);
		} else {
			// Simulação de uma requisição para a API (GET /v1/me/playlists)
			const item1 = new vscode.TreeItem('Músicas Curtidas', vscode.TreeItemCollapsibleState.None);
			item1.iconPath = new vscode.ThemeIcon('heart');

			const item2 = new vscode.TreeItem('Rock Classics', vscode.TreeItemCollapsibleState.None);
			item2.iconPath = new vscode.ThemeIcon('list-music');

			const item3 = new vscode.TreeItem('Descobertas da Semana', vscode.TreeItemCollapsibleState.None);
			item3.iconPath = new vscode.ThemeIcon('radio-tower');

			return Promise.resolve([item1, item2, item3]);
		}
	}
}
