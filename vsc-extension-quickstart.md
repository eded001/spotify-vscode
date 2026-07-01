# Bem-vindo à sua Extensão do VS Code

## O que tem na pasta

- Esta pasta contém todos os arquivos necessários para a sua extensão.
- `package.json` - este é o arquivo de manifesto no qual você declara sua extensão e comandos.
  - O plugin de exemplo registra um comando e define seu título e nome. Com essas informações, o VS Code pode mostrar o comando na paleta de comandos. Ele ainda não precisa carregar o plugin.
- `src/extension.ts` - este é o arquivo principal onde você fornecerá a implementação do seu comando.
  - O arquivo exporta uma função, `activate`, que é chamada na primeira vez que sua extensão é ativada (neste caso, ao executar o comando). Dentro da função `activate`, chamamos `registerCommand`.
  - Passamos a função contendo a implementação do comando como o segundo parâmetro para `registerCommand`.

## Configuração

- instale as extensões recomendadas (amodio.tsl-problem-matcher, ms-vscode.extension-test-runner e dbaeumer.vscode-eslint)

## Comece a rodar imediatamente

- Pressione `F5` para abrir uma nova janela com a sua extensão carregada.
- Execute o seu comando na paleta de comandos pressionando (`Ctrl+Shift+P` ou `Cmd+Shift+P` no Mac) e digitando `Hello World` (ou `Olá Mundo`).
- Defina pontos de interrupção (breakpoints) no seu código dentro de `src/extension.ts` para depurar a sua extensão.
- Encontre a saída da sua extensão no console de depuração.

## Faça alterações

- Você pode reiniciar a extensão a partir da barra de ferramentas de depuração após alterar o código em `src/extension.ts`.
- Você também pode recarregar (`Ctrl+R` ou `Cmd+R` no Mac) a janela do VS Code com sua extensão para carregar suas alterações.

## Explore a API

- Você pode ver o conjunto completo da nossa API ao abrir o arquivo `node_modules/@types/vscode/index.d.ts`.

## Executar testes

- Instale o [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner)
- Execute a tarefa "watch" através do comando **Tasks: Run Task**. Certifique-se de que isso está rodando, ou os testes podem não ser descobertos.
- Abra a visualização de Testes na barra de atividades e clique no botão "Run Test", ou use o atalho `Ctrl/Cmd + ; A`
- Veja a saída do resultado do teste na visualização Test Results.
- Faça alterações em `src/test/extension.test.ts` ou crie novos arquivos de teste dentro da pasta `test`.
  - O executor de testes fornecido apenas considerará arquivos correspondentes ao padrão de nome `**.test.ts`.
  - Você pode criar pastas dentro da pasta `test` para estruturar seus testes como quiser.

## Vá além

- Reduza o tamanho da extensão e melhore o tempo de inicialização fazendo o [agrupamento da sua extensão (bundling)](https://code.visualstudio.com/api/working-with-extensions/bundling-extension).
- [Publique sua extensão](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) no marketplace de extensões do VS Code.
- Automatize compilações configurando [Integração Contínua](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).
