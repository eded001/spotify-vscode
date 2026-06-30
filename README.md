# Spotify Player para VS Code

Uma extensão que integra o seu ambiente de desenvolvimento do VS Code com o Spotify, permitindo controlar suas músicas e visualizar suas playlists sem precisar sair do editor.

## O que já foi implementado

O desenvolvimento da extensão está em andamento. Abaixo está o registro de tudo o que já foi construído e configurado no projeto até agora:

### 1. Interface na Barra de Status (Status Bar)

Criamos botões de controle de mídia na barra azul inferior (Status Bar) do VS Code. Eles ficam visíveis o tempo todo durante a programação:

- **Botão Anterior** `$(chevron-left)`
- **Botão Tocar/Pausar** `$(play)` / `$(debug-pause)`
- **Botão Próxima** `$(chevron-right)`
- **Informação da Música** `$(music)` (Mostra a música atual ou estado "Pausado")

_Nota: Os botões já estão associados a comandos (`spotify-player.play`, etc), mas atualmente usam uma lógica de simulação (Mock) enquanto a integração da API de Player não é concluída._

### 2. Barra Lateral Dedicada (Tree View)

- Criamos um ícone SVG personalizado do Spotify (`media/spotify-logo.svg`).
- Registramos um novo painel na "Barra de Atividades" (Activity Bar) do VS Code exclusivo para a nossa extensão.
- Desenvolvemos a classe `SpotifyPlaylistProvider` para estruturar e exibir os dados das playlists.
- Adicionamos 3 playlists fictícias usando ícones nativos do VS Code para visualização da estrutura de pastas.

### 3. Tela de Boas-Vindas (Welcome View)

Quando o usuário não está autenticado, a barra lateral oculta as playlists mockadas e exibe nativamente um painel amigável (`viewsWelcome`) convidando o usuário a fazer o Login no Spotify, com um botão azul "Conectar ao Spotify".

### 4. Fluxo de Autenticação OAuth 2.0 Completo

Implementamos o sistema seguro de login do Spotify diretamente no VS Code (`comando: spotify-player.login`):

- **Geração de URL:** O sistema constrói a URL oficial de autorização pedindo os escopos necessários (`user-read-playback-state`, `user-modify-playback-state`, `playlist-read-private`).
- **Abertura Inteligente:** O VS Code tenta abrir o navegador nativo sozinho. Caso o sistema operacional bloqueie, uma notificação flutuante fornece a opção "Copiar Link" usando a área de transferência do VS Code.
- **Servidor Local (Callback):** A extensão levanta um servidor HTTP invisível na porta 8888 (`http://[::1]:8888/callback`) para aguardar a volta do navegador.
- **Troca de Token:** Quando o navegador devolve o Código de Autorização (`code`), o servidor local faz uma requisição POST invisível (em base64 com Client ID e Secret) gerando com sucesso o **Access Token** do usuário.
- **Encerramento Limpo:** O servidor local envia uma mensagem de sucesso para o navegador HTML e se autodestrói para liberar a memória da máquina.

---

## Próximos Passos (To-Do)

- [ ] Guardar o `access_token` e o `refresh_token` de forma segura no cofre do VS Code (`context.secrets`).
- [ ] Substituir as playlists fictícias por uma requisição `GET /v1/me/playlists` usando o token real.
- [ ] Implementar sistema de Polling (`setInterval`) para atualizar a Barra de Status automaticamente com a música que está tocando no momento.
- [ ] Conectar os botões da Barra de Status aos comandos reais de `PUT /v1/me/player/pause` e `POST /v1/me/player/next`.

## Configuração do Desenvolvedor

Lembre-se de colocar as suas chaves do Spotify Developer Dashboard no arquivo `src/extension.ts` nas variáveis `clientId` e `clientSecret` para que a autenticação funcione. A URL de redirecionamento cadastrada no Dashboard do Spotify deve ser exatamente `http://[::1]:8888/callback`.
