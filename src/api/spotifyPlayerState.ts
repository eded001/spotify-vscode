import { SpotifyBaseClient } from './spotifyBaseClient';
import { logger } from '../logger';

/**
 * Interface que representa o estado de reprodução retornado pela API do Spotify.
 */
export interface SpotifyPlaybackState {
    /** Indica se há uma música tocando no momento. */
    is_playing: boolean;
    /** O progresso atual da música em milissegundos. */
    progress_ms: number;
    /** Os metadados da faixa/música que está tocando, ou null se não houver faixa. */
    item: {
        /** O nome da música. */
        name: string;
        /** A duração total da música em milissegundos. */
        duration_ms: number;
        /** Informações do álbum. */
        album: {
            /** Imagens do álbum (capas). */
            images: { url: string }[];
            /** O nome do álbum. */
            name: string;
        };
        /** Artistas vinculados à música. */
        artists: { name: string }[];
    } | null;
}

/**
 * Consulta o estado atual de reprodução do usuário autenticado no Spotify.
 * Retorna null se não houver nenhum dispositivo ativo ou se nenhuma música estiver tocando
 * (recebendo HTTP 204 do Spotify).
 * 
 * @param client O cliente base de API autenticado.
 * @returns Promessa com o estado atual de reprodução ou null caso não haja reprodução ativa ou ocorra um erro.
 */
export async function getCurrentPlayback(client: SpotifyBaseClient): Promise<SpotifyPlaybackState | null> {
    try {
        const response = await client.fetchWithAuth('https://api.spotify.com/v1/me/player', {
            method: 'GET'
        });
        if (response.status === 204) {
            return null; // Nenhuma música tocando
        }
        if (!response.ok) {
            logger.error(`Erro ao obter estado do player: HTTP ${response.status}`);
            return null;
        }
        return await response.json() as SpotifyPlaybackState;
    } catch (error: any) {
        logger.error(`Exceção ao obter estado do player: ${error.message}`);
        return null;
    }
}
