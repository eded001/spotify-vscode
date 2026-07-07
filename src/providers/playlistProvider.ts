import * as vscode from 'vscode';
import { SpotifyBaseClient } from '../api/spotifyBaseClient';
import { getUserPlaylists } from '../api/spotifyPlaylists';
import { logger } from '../logger';

/**
 * Provedor de dados (TreeDataProvider) para renderizar a lista de playlists do Spotify
 * na barra lateral do VS Code.
 */
export class SpotifyPlaylistProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    /**
     * Cria uma instância de SpotifyPlaylistProvider.
     * 
     * @param spotifyClient O cliente base de comunicação com a API do Spotify.
     */
    constructor(private spotifyClient: SpotifyBaseClient) {}

    /**
     * Solicita a atualização (refresh) da árvore na interface do VS Code,
     * forçando a recarga dos dados a partir do Spotify.
     */
    refresh(): void {
        logger.info('SpotifyPlaylistProvider: refresh acionado.');
        this._onDidChangeTreeData.fire();
    }

    /**
     * Retorna a representação de visualização (TreeItem) de um elemento específico na árvore.
     * 
     * @param element O item de árvore.
     * @returns O próprio item de árvore do VS Code.
     */
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Recupera os itens filhos do elemento fornecido, ou os itens raiz caso nenhum elemento seja especificado.
     * Consulta a API do Spotify para obter as playlists do usuário logado e as converte
     * em elementos clicáveis na árvore do VS Code.
     * 
     * @param element O elemento pai opcional.
     * @returns Uma promessa que resolve em uma lista de itens da árvore do VS Code.
     */
    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        logger.info('SpotifyPlaylistProvider.getChildren chamado.');
        const loggedIn = await this.spotifyClient.hasValidToken();
        if (!loggedIn) {
            logger.warn('SpotifyPlaylistProvider: Usuário não está logado ou token é inválido. Retornando árvore vazia.');
            return [];
        }

        if (element) {
            return [];
        }

        try {
            const playlists = await getUserPlaylists(this.spotifyClient);
            logger.info(`SpotifyPlaylistProvider: ${playlists.length} playlists recebidas. Mapeando para TreeItem...`);
            return playlists.map(playlist => {
                const item = new vscode.TreeItem(playlist.name, vscode.TreeItemCollapsibleState.None);
                item.iconPath = new vscode.ThemeIcon('list-music');
                item.tooltip = playlist.description || 'Playlist do Spotify';
                item.id = playlist.id;
                item.command = {
                    command: 'spotify-player.playPlaylist',
                    title: 'Tocar Playlist',
                    arguments: [`spotify:playlist:${playlist.id}`, playlist.name]
                };
                return item;
            });
        } catch (error: any) {
            logger.error(`SpotifyPlaylistProvider: Falha ao carregar playlists na sidebar: ${error.message}`, error);
            vscode.window.showErrorMessage(`Falha ao obter playlists: ${error.message}`);
            return [new vscode.TreeItem('Erro ao obter playlists', vscode.TreeItemCollapsibleState.None)];
        }
    }
}
