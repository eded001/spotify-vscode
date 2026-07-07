# Spotify API Integration Documentation

Esta pasta e este arquivo documentam como o mini-player do VS Code interage com a API do Spotify, incluindo a autenticação, o ciclo de vida dos tokens de acesso e o tratamento de erros.

## Arquitetura do Cliente Spotify

A integração está contida na pasta `src/api/` e é dividida nos seguintes módulos:

- [spotifyBaseClient.ts](file:///home/ed/Documents/GitHub/spotify-player/src/api/spotifyBaseClient.ts): O cliente base que gerencia os tokens e as requisições autenticadas.
- [spotifyPlayback.ts](file:///home/ed/Documents/GitHub/spotify-player/src/api/spotifyPlayback.ts): Métodos para controlar a reprodução (play, pause, next, previous).
- [spotifyPlayerState.ts](file:///home/ed/Documents/GitHub/spotify-player/src/api/spotifyPlayerState.ts): Método para ler o estado atual do tocador do Spotify.
- [spotifyPlaylists.ts](file:///home/ed/Documents/GitHub/spotify-player/src/api/spotifyPlaylists.ts): Método para ler as playlists do usuário autenticado.

---

## 1. Fluxo de Autenticação e Gestão de Tokens

O Spotify utiliza o fluxo **Authorization Code com PKCE / Client Secret** para o login do usuário.

### Inicialização e Recuperação de Tokens

Quando a extensão é inicializada, o `SpotifyBaseClient` carrega as credenciais do armazenamento seguro do VS Code (`context.secrets`):

- `spotify_access_token`: Usado para assinar requisições no header `Authorization`.
- `spotify_refresh_token`: Usado para solicitar um novo token de acesso caso o atual expire.
- `spotify_token_expiration`: O timestamp UNIX em milissegundos de quando o token expira.

### Renovação de Token Automatizada

Antes de cada requisição realizada via `fetchWithAuth`, o cliente chama `hasValidToken()`.

- Se o token estiver expirado (`Date.now() >= expirationTime`), o cliente dispara automaticamente a requisição de renovação para o endpoint do Spotify (`https://accounts.spotify.com/api/token`) usando o `refresh_token`.
- Se o endpoint do Spotify responder com erro de cliente (`400 Bad Request` ou `401 Unauthorized`), significa que o refresh token foi revogado pelo usuário. O cliente então chama `clearTokens()` para excluir os segredos armazenados e forçar o redirecionamento de login no VS Code.

### Tratamento de Erro 401 Transitório

Caso uma chamada à API do Spotify retorne `401 Unauthorized` mesmo após `hasValidToken()` ter sido avaliado como verdadeiro (por exemplo, se o token foi invalidado remotamente), o método `fetchWithAuth` tenta renovar o token e repetir a requisição original imediatamente.

---

## 2. Lógica de Requisições com `fetchWithAuth`

Para evitar cabeçalhos inválidos ou erros no servidor do Spotify:

- O cabeçalho `'Content-Type': 'application/json'` só é anexado se a requisição tiver um corpo (`options.body`). Requisições sem corpo (como `PUT /pause` ou `POST /next`) não enviam o header `Content-Type`.
- O cabeçalho `Authorization: Bearer <token>` é anexado automaticamente.
- Headers customizados fornecidos em `options.headers` são preservados e mesclados de forma segura.

---

## 3. Tratamento de Erros da API do Spotify

A API do Spotify retorna erros no seguinte formato JSON em requisições não bem-sucedidas:

```json
{
  "error": {
    "status": 403,
    "message": "Player command failed: No active device found"
  }
}
```

A função utilitária `getErrorMessage(response, defaultMessage)` no cliente base extrai dinamicamente a mensagem interna (`error.message`) retornada pelo Spotify. Isso permite exibir avisos mais detalhados e amigáveis ao usuário (por exemplo, avisando que não há um dispositivo ativo para reprodução) em vez de apenas o status HTTP genérico (como `Forbidden`).

## 📄 Notas de Versão (Release Notes)

### 1.0.0

- Lançamento inicial da extensão.
- Suporte para login via OAuth2 com PKCE integrado.
- Mini-player com WebviewView interativa na barra lateral.
- Controles integrados na Barra de Status do VS Code.
- Lista de playlists na árvore da sidebar.
