import * as vscode from 'vscode';
import { logger } from '../logger';

/**
 * Cliente base de comunicação com a API do Spotify.
 * Gerencia a autenticação, carregamento, expiração e renovação automática de tokens,
 * bem como a assinatura de cabeçalhos de requisição.
 */
export class SpotifyBaseClient {
    private readonly clientId = 'da282d8bd0f441d7bd7468f6f3b0f440';
    private readonly clientSecret = 'a0add161a55a4cb487f14b7f65f34d19';
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private tokenExpirationTime: number = 0;

    /**
     * Cria uma instância do SpotifyBaseClient.
     * 
     * @param context O contexto da extensão do VS Code para acesso aos armazenamentos de segredos e estado global.
     */
    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Inicializa o cliente carregando os tokens salvos anteriormente dos segredos seguros
     * e do estado global do VS Code.
     */
    async initialize() {
        logger.info('Inicializando SpotifyBaseClient e carregando tokens armazenados...');
        this.accessToken = await this.context.secrets.get('spotify_access_token') || null;
        this.refreshToken = await this.context.secrets.get('spotify_refresh_token') || null;
        const exp = await this.context.globalState.get<string>('spotify_token_expiration');
        this.tokenExpirationTime = exp ? parseInt(exp, 10) : 0;
        
        logger.info(`Tokens carregados. Access Token: ${this.accessToken ? 'Presente' : 'Ausente'}, Refresh Token: ${this.refreshToken ? 'Presente' : 'Ausente'}, Expira em: ${new Date(this.tokenExpirationTime).toLocaleString()}`);
    }

    /**
     * Define novos tokens de acesso e de atualização, calculando a data de expiração e
     * persistindo-os de maneira segura no VS Code.
     * 
     * @param accessToken O token de acesso gerado pela API do Spotify.
     * @param refreshToken O token de atualização (refresh token) do Spotify.
     * @param expiresInSeconds O tempo de vida do token de acesso em segundos.
     */
    async setTokens(accessToken: string, refreshToken: string, expiresInSeconds: number) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpirationTime = Date.now() + (expiresInSeconds * 1000);

        logger.info(`Salvando novos tokens. Expiração calculada para: ${new Date(this.tokenExpirationTime).toLocaleString()} (em ${expiresInSeconds}s)`);
        await this.context.secrets.store('spotify_access_token', accessToken);
        await this.context.secrets.store('spotify_refresh_token', refreshToken);
        await this.context.globalState.update('spotify_token_expiration', this.tokenExpirationTime.toString());
    }

    /**
     * Verifica se o token de acesso atual é válido e se não expirou.
     * Caso o token tenha expirado, tenta renová-lo automaticamente usando o refresh token.
     * 
     * @returns Promessa contendo true se o token for válido ou se a renovação ocorreu com sucesso, e false caso contrário.
     */
    async hasValidToken(): Promise<boolean> {
        if (!this.accessToken) {
            logger.debug('hasValidToken: Nenhum Token de Acesso encontrado.');
            return false;
        }
        if (Date.now() >= this.tokenExpirationTime) {
            logger.info('hasValidToken: Token de Acesso expirado. Tentando renovar...');
            return await this.refreshAccessToken();
        }
        return true;
    }

    /**
     * Efetua a requisição de renovação de token (refresh token flow) com a API do Spotify.
     * Se a renovação falhar com código de erro 400 ou 401, limpa as credenciais inválidas armazenadas.
     * 
     * @returns Promessa com true se o token foi renovado com sucesso, false caso contrário.
     */
    private async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) {
            logger.warn('refreshAccessToken: Tentativa de renovação de token sem Refresh Token disponível.');
            return false;
        }
        try {
            logger.info('Enviando requisição de renovação de token para o Spotify...');
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64')
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken
                }).toString()
            });

            const data = await response.json() as any;
            if (data.access_token) {
                const newAccessToken = data.access_token as string;
                const newRefreshToken = (data.refresh_token || this.refreshToken) as string;
                const expiresIn = (data.expires_in || 3600) as number;

                logger.info('Token de Acesso renovado com sucesso.');
                await this.setTokens(newAccessToken, newRefreshToken, expiresIn);
                return true;
            } else {
                logger.error('Resposta da renovação de token sem access_token.', data);
                if (response.status === 400 || response.status === 401) {
                    logger.warn('Limpar tokens porque a resposta de renovação indicou credenciais inválidas.');
                    await this.clearTokens();
                }
            }
        } catch (e) {
            logger.error('Erro ao renovar token do Spotify:', e);
        }
        return false;
    }

    /**
     * Limpa os tokens armazenados em memória e nos segredos da extensão,
     * efetivamente desconectando o usuário.
     */
    async clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpirationTime = 0;
        await this.context.secrets.delete('spotify_access_token');
        await this.context.secrets.delete('spotify_refresh_token');
        await this.context.globalState.update('spotify_token_expiration', undefined);
        logger.info('Tokens locais e armazenados foram limpos.');
    }

    /**
     * Realiza uma requisição HTTP autenticada utilizando fetch.
     * Insere automaticamente o cabeçalho Authorization com o Bearer token,
     * e o Content-Type: application/json se houver corpo (body) na requisição.
     * Trata erros transitórios do tipo 401 tentando renovar o token e repetir a chamada uma vez.
     * 
     * @param url O endpoint a ser chamado.
     * @param options As configurações adicionais da requisição (RequestInit).
     * @returns Resposta HTTP obtida.
     * @throws Erro se o usuário não estiver autenticado ou se a requisição falhar criticamente.
     */
    async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
        const method = options.method || 'GET';
        logger.debug(`fetchWithAuth: Iniciando requisição ${method} para ${url}`);

        const isValid = await this.hasValidToken();
        if (!isValid) {
            logger.warn(`fetchWithAuth: Falha na requisição ${method} para ${url} devido a usuário não autenticado.`);
            throw new Error('Usuário não autenticado no Spotify.');
        }

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.accessToken}`,
            ...((options.headers as Record<string, string>) || {})
        };

        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        let response = await fetch(url, { ...options, headers });
        logger.debug(`fetchWithAuth: ${method} ${url} retornou status ${response.status}`);
        
        if (response.status === 401) {
            logger.info(`fetchWithAuth: Recebido 401 Unauthorized de ${url}. Tentando renovar o token e repetir a requisição...`);
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                response = await fetch(url, { ...options, headers });
                logger.info(`fetchWithAuth: Repetição de requisição ${method} para ${url} após renovação de token retornou status ${response.status}`);
            } else {
                logger.error(`fetchWithAuth: Falha ao renovar token após erro 401 in ${url}`);
            }
        }
        return response;
    }
}

/**
 * Função utilitária para extrair mensagens de erro específicas retornadas pela API do Spotify.
 * Se a resposta for JSON e contiver uma mensagem interna de erro, ela é extraída;
 * caso contrário, retorna a mensagem genérica correspondente ou o status de texto HTTP.
 * 
 * @param response Objeto de resposta (Response) do fetch.
 * @param defaultMessage Mensagem padrão a ser exibida caso não haja mensagem de erro específica no corpo.
 * @returns Mensagem de erro string extraída.
 */
export async function getErrorMessage(response: Response, defaultMessage: string): Promise<string> {
    try {
        const body = await response.json() as any;
        if (body && body.error && body.error.message) {
            return body.error.message;
        }
    } catch {
        // Ignorar erro de parsing se não for JSON
    }
    return response.statusText || `${defaultMessage} (Status ${response.status})`;
}

