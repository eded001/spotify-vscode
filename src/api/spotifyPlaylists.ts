import { SpotifyBaseClient, getErrorMessage } from './spotifyBaseClient';
import { logger } from '../logger';

/**
 * Interface que representa os metadados simplificados de uma playlist do Spotify.
 */
export interface SpotifyPlaylist {
    /** O identificador único da playlist (ID). */
    id: string;
    /** O nome da playlist. */
    name: string;
    /** A descrição da playlist. */
    description: string;
    /** Lista opcional de imagens de capa da playlist. */
    images?: Array<{ url: string }>;
}

/**
 * Obtém a lista de playlists públicas e privadas do usuário autenticado no Spotify.
 * Limita o resultado às primeiras 50 playlists.
 * 
 * @param client O cliente base de API autenticado.
 * @returns Promessa com uma lista de playlists (SpotifyPlaylist).
 * @throws Erro se a requisição de carregamento falhar.
 */
export async function getUserPlaylists(client: SpotifyBaseClient): Promise<SpotifyPlaylist[]> {
    logger.info('Carregando playlists do usuário no Spotify...');
    const response = await client.fetchWithAuth('https://api.spotify.com/v1/me/playlists?limit=50');
    if (!response.ok) {
        const errMsg = await getErrorMessage(response, 'Erro ao carregar playlists');
        logger.error(`Erro ao carregar playlists: HTTP ${response.status} - ${errMsg}`);
        throw new Error(`Falha ao carregar playlists do Spotify: ${errMsg}`);
    }
    const data = await response.json() as any;
    const items = data.items || [];
    logger.info(`Playlists carregadas com sucesso. Total obtido: ${items.length}`);
    return items;
}

