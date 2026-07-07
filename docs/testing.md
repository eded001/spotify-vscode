# Testing and Mocking Setup Documentation

Este arquivo descreve a infraestrutura de testes desenvolvida para validar a integração com a API do Spotify sem depender de conexões de rede reais ou de instâncias completas do VS Code.

---

## 1. Como Executar os Testes

Os testes de unidade do projeto podem ser executados rapidamente a partir do terminal através do Mocha:

1. Compile os testes e o código-fonte:

   ```bash
   npm run compile-tests && npm run compile
   ```

2. Execute a suíte de testes com o Mocha pré-carregando o mock do VS Code:

   ```bash
   npx mocha --ui tdd --require out/test/setup.js out/test/spotifyApi.test.js
   ```

---

## 2. Mock do VS Code (`setup.ts`)

Como as APIs do VS Code (módulo `'vscode'`) não existem fora do processo do Extension Development Host, tentar rodar testes diretamente no Node.js resulta em erros do tipo `Cannot find module 'vscode'`.

Para resolver isso, criamos o arquivo [setup.ts](file:///home/ed/Documents/GitHub/spotify-player/src/test/setup.ts). Ele intercepta o carregamento de módulos do Node.js:

```typescript
import Module = require("module");

const mockVscode = {
  window: {
    createOutputChannel: (name: string) => ({
      appendLine: (value: string) => {},
      show: () => {},
    }),
  },
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function (this: any, id: string) {
  if (id === "vscode") {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments as any);
};
```

Quando um arquivo de teste ou código-fonte tenta importar `'vscode'`, o Node.js recebe o objeto `mockVscode` em vez de falhar, permitindo a execução rápida fora do VS Code.

---

## 3. Mock Dinâmico do `fetch`

Na suíte de testes [spotifyApi.test.ts](file:///home/ed/Documents/GitHub/spotify-player/src/test/spotifyApi.test.ts), as chamadas de rede são testadas substituindo a função global `globalThis.fetch`.

A técnica consiste em:

- Salvar a referência ao `fetch` original no `suiteSetup`.
- Substituir o `globalThis.fetch` por uma função mock que captura as chamadas em um array `fetchCalls` e retorna dados mockados de acordo com o objeto global `mockResponse`.
- Restaurar o `fetch` original no `suiteTeardown`.

### Exemplo de Teste de Renovação e Limpeza de Token

```typescript
test("SpotifyBaseClient cleans up invalid credentials on 400 refresh response", async () => {
  const client = new SpotifyBaseClient(mockContext);
  await client.setTokens("oldAccess", "refresh123", -10); // força expiração

  globalThis.fetch = async (url, init) => {
    if (url === "https://accounts.spotify.com/api/token") {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: "invalid_grant" }),
      } as Response;
    }
    return { ok: true, json: async () => ({}) } as Response;
  };

  // A chamada deve falhar, disparando a limpeza dos segredos armazenados
  await assert.rejects(async () => {
    await getUserPlaylists(client);
  }, /Usuário não autenticado no Spotify/);

  // Verifica se os segredos foram devidamente deletados do mockContext
  const accessToken = await mockContext.secrets.get("spotify_access_token");
  assert.strictEqual(accessToken, null);
});
```
