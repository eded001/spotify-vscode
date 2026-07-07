# Changelog

Todo o progresso notável e alterações no projeto **Spotify Player para VS Code** serão documentados neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e este projeto segue o [SemVer](https://semver.org/lang/pt-BR/).

---

## [0.0.1] - 06-07-2026

Esta é a versão inicial de desenvolvimento da extensão, integrando o Spotify diretamente ao ambiente do VS Code.

### Adicionado

- **Autenticação Segura**: Fluxo OAuth2 completo (Authorization Code com PKCE / Client Secret) que abre o navegador para login e armazena os tokens de acesso de forma criptografada nos segredos (`context.secrets`) do VS Code.
- **Servidor de Callback Local**: Servidor HTTP temporário (porta `8888` / IPv6 `[::1]`) criado dinamicamente apenas para capturar o código de autorização de login e exibir uma página de sucesso personalizada.
- **Barra de Status**: Botões rápidos de reprodução (Anterior, Play/Pause, Próximo) e mostrador de música atual no rodapé do VS Code com atualizações reativas.
- **Provedor de Playlists**: Tree View na barra lateral mostrando as playlists do usuário no Spotify, permitindo iniciar a reprodução da playlist selecionada com um clique.
- **Mini-Player em Webview**: Painel interativo com arte do álbum, controle reativo do progresso da faixa atual e botões integrados.
- **Logs de Depuração**: Canal de saída ("Spotify Player") estruturado para rastrear e depurar erros de API, ciclo de vida dos tokens e fluxos de autenticação.
- **Suíte de Testes Unitários**: Testes automatizados usando Mocha e mocks (para interceptar chamadas `fetch` de rede e requisições do módulo `'vscode'`), cobrindo a renovação de tokens, comportamento do player em erros de requisição e comandos de reprodução.
- **Documentação de Código**: Comentários JSDoc completos em todas as classes, interfaces e funções, além de guias de arquitetura (`docs/api.md`), infraestrutura de testes (`docs/testing.md`) e README otimizado para o Marketplace.
