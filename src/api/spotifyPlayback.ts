import { SpotifyBaseClient, getErrorMessage } from './spotifyBaseClient';
import { logger } from '../logger';

/**
 * Inicia ou retoma a reprodução no Spotify.
 * Se um URI for fornecido, a reprodução começará a partir desse recurso.
 * URIs de episódios são tocados diretamente (uris array),
 * enquanto URIs de álbuns, artistas ou playlists são tocados com contexto (context_uri).
 * 
 * @param client O cliente base de API autenticado.
 * @param uri O URI opcional do recurso do Spotify a ser tocado (ex: spotify:playlist:...).
 * @throws Erro se a requisição de reprodução falhar.
 */
export async function playSpotify(client: SpotifyBaseClient, uri?: string): Promise<void> {
    logger.info(`playSpotify chamado${uri ? ' com URI: ' + uri : ''}`);
    let body: string | undefined;
    if (uri) {
        if (uri.includes(':episode:')) {
            body = JSON.stringify({ uris: [uri] });
        } else {
            body = JSON.stringify({ context_uri: uri });
        }
    }
    const response = await client.fetchWithAuth('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        body
    });
    if (!response.ok) {
        const errMsg = await getErrorMessage(response, 'Erro ao iniciar reprodução');
        logger.error(`Erro no playSpotify: HTTP ${response.status} - ${errMsg}`);
        throw new Error(`Erro ao iniciar reprodução: ${errMsg}`);
    }
    logger.info('playSpotify executado com sucesso.');
}

/**
 * Pausa a reprodução atual no Spotify.
 * 
 * @param client O cliente base de API autenticado.
 * @throws Erro se a requisição para pausar falhar.
 */
export async function pauseSpotify(client: SpotifyBaseClient): Promise<void> {
    logger.info('pauseSpotify chamado');
    const response = await client.fetchWithAuth('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT'
    });
    if (!response.ok) {
        const errMsg = await getErrorMessage(response, 'Erro ao pausar');
        logger.error(`Erro no pauseSpotify: HTTP ${response.status} - ${errMsg}`);
        throw new Error(`Erro ao pausar: ${errMsg}`);
    }
    logger.info('pauseSpotify executado com sucesso.');
}

/**
 * Avança para a próxima música na fila do Spotify.
 * 
 * @param client O cliente base de API autenticado.
 * @throws Erro se a requisição de avanço falhar.
 */
export async function nextSpotify(client: SpotifyBaseClient): Promise<void> {
    logger.info('nextSpotify chamado');
    const response = await client.fetchWithAuth('https://api.spotify.com/v1/me/player/next', {
        method: 'POST'
    });
    if (!response.ok) {
        const errMsg = await getErrorMessage(response, 'Erro ao pular música');
        logger.error(`Erro no nextSpotify: HTTP ${response.status} - ${errMsg}`);
        throw new Error(`Erro ao pular música: ${errMsg}`);
    }
    logger.info('nextSpotify executado com sucesso.');
}

/**
 * Retorna para a música anterior na fila do Spotify.
 * 
 * @param client O cliente base de API autenticado.
 * @throws Erro se a requisição de retrocesso falhar.
 */
export async function previousSpotify(client: SpotifyBaseClient): Promise<void> {
    logger.info('previousSpotify chamado');
    const response = await client.fetchWithAuth('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST'
    });
    if (!response.ok) {
        const errMsg = await getErrorMessage(response, 'Erro ao voltar música');
        logger.error(`Erro no previousSpotify: HTTP ${response.status} - ${errMsg}`);
        throw new Error(`Erro ao voltar música: ${errMsg}`);
    }
    logger.info('previousSpotify executado com sucesso.');
}

