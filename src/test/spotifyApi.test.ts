import * as assert from 'assert';
import * as vscode from 'vscode';
import { SpotifyBaseClient } from '../api/spotifyBaseClient';
import { getUserPlaylists } from '../api/spotifyPlaylists';
import { getCurrentPlayback } from '../api/spotifyPlayerState';
import { playSpotify, pauseSpotify, nextSpotify, previousSpotify } from '../api/spotifyPlayback';

// Estruturas auxiliares para simular o armazenamento persistente do VS Code (Secrets e GlobalState) nos testes
const mockSecretsStore: Record<string, string> = {};
const mockGlobalState: Record<string, any> = {};

/**
 * Mock simplificado do ExtensionContext do VS Code.
 * Usado para instanciar o SpotifyBaseClient sem requerer uma instância do editor em execução.
 */
const mockContext = {
    secrets: {
        get: async (key: string) => mockSecretsStore[key] || null,
        store: async (key: string, value: string) => { mockSecretsStore[key] = value; },
        delete: async (key: string) => { delete mockSecretsStore[key]; }
    },
    globalState: {
        get: (key: string) => mockGlobalState[key],
        update: async (key: string, value: any) => { mockGlobalState[key] = value; }
    }
} as unknown as vscode.ExtensionContext;

/**
 * Suíte de testes unitários para a integração com a API do Spotify.
 * Utiliza interceptação de chamadas globais de rede (mock de fetch) para simular respostas do servidor.
 */
suite('Spotify API Test Suite', () => {
    let originalFetch: typeof globalThis.fetch;
    let fetchCalls: Array<{ url: string | URL | Request, init?: RequestInit }> = [];
    let mockResponse: { status: number, statusText: string, json: () => Promise<any>, ok: boolean };

    suiteSetup(() => {
        originalFetch = globalThis.fetch;
        globalThis.fetch = async (url, init) => {
            fetchCalls.push({ url, init });
            return {
                ok: mockResponse.ok,
                status: mockResponse.status,
                statusText: mockResponse.statusText,
                json: mockResponse.json,
                text: async () => JSON.stringify(await mockResponse.json())
            } as Response;
        };
    });

    suiteTeardown(() => {
        globalThis.fetch = originalFetch;
    });

    setup(() => {
        fetchCalls = [];
        // Clear mock stores
        for (const key of Object.keys(mockSecretsStore)) {
            delete mockSecretsStore[key];
        }
        for (const key of Object.keys(mockGlobalState)) {
            delete mockGlobalState[key];
        }
    });

    test('getUserPlaylists returns items on success', async () => {
        const client = new SpotifyBaseClient(mockContext);
        await client.setTokens('access123', 'refresh123', 3600);

        mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
                items: [
                    { id: 'playlist1', name: 'Chill Hits', description: 'Chill vibes' },
                    { id: 'playlist2', name: 'Rock Classics', description: 'Classic rock' }
                ]
            })
        };

        const playlists = await getUserPlaylists(client);
        assert.strictEqual(playlists.length, 2);
        assert.strictEqual(playlists[0].id, 'playlist1');
        assert.strictEqual(playlists[0].name, 'Chill Hits');
        assert.strictEqual(fetchCalls[0].url, 'https://api.spotify.com/v1/me/playlists?limit=50');
    });

    test('getUserPlaylists handles Spotify API error response message', async () => {
        const client = new SpotifyBaseClient(mockContext);
        await client.setTokens('access123', 'refresh123', 3600);

        mockResponse = {
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({
                error: {
                    status: 400,
                    message: 'Invalid limit parameter'
                }
            })
        };

        await assert.rejects(
            async () => {
                await getUserPlaylists(client);
            },
            /Falha ao carregar playlists do Spotify: Invalid limit parameter/
        );
    });

    test('getCurrentPlayback returns state on 200 and null on 204', async () => {
        const client = new SpotifyBaseClient(mockContext);
        await client.setTokens('access123', 'refresh123', 3600);

        // 200 Case
        mockResponse = {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
                is_playing: true,
                progress_ms: 50000,
                item: { name: 'Song Title', duration_ms: 180000 }
            })
        };

        const state = await getCurrentPlayback(client);
        assert.ok(state);
        assert.strictEqual(state.is_playing, true);
        assert.strictEqual(state.progress_ms, 50000);
        assert.strictEqual(state.item?.name, 'Song Title');

        // 204 Case (No active playback)
        mockResponse = {
            ok: true,
            status: 204,
            statusText: 'No Content',
            json: async () => null
        };

        const nullState = await getCurrentPlayback(client);
        assert.strictEqual(nullState, null);
    });

    test('playback commands construct headers and bodies correctly', async () => {
        const client = new SpotifyBaseClient(mockContext);
        await client.setTokens('access123', 'refresh123', 3600);

        mockResponse = {
            ok: true,
            status: 204,
            statusText: 'No Content',
            json: async () => null
        };

        // playSpotify with context URI
        await playSpotify(client, 'spotify:playlist:abc');
        assert.strictEqual(fetchCalls[0].url, 'https://api.spotify.com/v1/me/player/play');
        assert.strictEqual(fetchCalls[0].init?.method, 'PUT');
        assert.strictEqual(fetchCalls[0].init?.body, JSON.stringify({ context_uri: 'spotify:playlist:abc' }));
        assert.strictEqual((fetchCalls[0].init?.headers as any)['Content-Type'], 'application/json');

        // playSpotify with episode URI
        fetchCalls = [];
        await playSpotify(client, 'spotify:episode:123');
        assert.strictEqual(fetchCalls[0].init?.body, JSON.stringify({ uris: ['spotify:episode:123'] }));

        // pauseSpotify (no body)
        fetchCalls = [];
        await pauseSpotify(client);
        assert.strictEqual(fetchCalls[0].url, 'https://api.spotify.com/v1/me/player/pause');
        assert.strictEqual(fetchCalls[0].init?.method, 'PUT');
        assert.strictEqual((fetchCalls[0].init?.headers as any)['Content-Type'], undefined); // should not be set because no body
    });

    test('SpotifyBaseClient token expiration and automatic renewal on 401', async () => {
        const client = new SpotifyBaseClient(mockContext);
        await client.setTokens('oldAccess', 'refresh123', -10); // expired

        let refreshCalled = false;
        globalThis.fetch = async (url, init) => {
            fetchCalls.push({ url, init });
            if (url === 'https://accounts.spotify.com/api/token') {
                refreshCalled = true;
                return {
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    json: async () => ({
                        access_token: 'newAccess',
                        refresh_token: 'refresh123',
                        expires_in: 3600
                    })
                } as Response;
            }
            return {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({ items: [] })
            } as Response;
        };

        await getUserPlaylists(client);
        assert.ok(refreshCalled);
        assert.strictEqual(fetchCalls[0].url, 'https://accounts.spotify.com/api/token');
        assert.strictEqual(fetchCalls[1].url, 'https://api.spotify.com/v1/me/playlists?limit=50');
        assert.strictEqual((fetchCalls[1].init?.headers as any)['Authorization'], 'Bearer newAccess');
    });

    test('SpotifyBaseClient cleans up invalid credentials on 400 refresh response', async () => {
        const client = new SpotifyBaseClient(mockContext);
        await client.setTokens('oldAccess', 'refresh123', -10); // forces refresh

        globalThis.fetch = async (url, init) => {
            fetchCalls.push({ url, init });
            if (url === 'https://accounts.spotify.com/api/token') {
                return {
                    ok: false,
                    status: 400,
                    statusText: 'Bad Request',
                    json: async () => ({ error: 'invalid_grant' })
                } as Response;
            }
            return {
                ok: true,
                status: 200,
                json: async () => ({})
            } as Response;
        };

        await assert.rejects(
            async () => {
                await getUserPlaylists(client);
            },
            /Usuário não autenticado no Spotify/
        );

        // Verify tokens were cleared from context
        const accessToken = await mockContext.secrets.get('spotify_access_token');
        const refreshToken = await mockContext.secrets.get('spotify_refresh_token');
        assert.strictEqual(accessToken, null);
        assert.strictEqual(refreshToken, null);
    });
});
