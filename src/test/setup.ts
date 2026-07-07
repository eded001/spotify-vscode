import Module = require('module');

/**
 * Mock simplificado das APIs do módulo 'vscode'.
 * Como os testes unitários rodam no processo padrão do Node.js (fora do Extension Development Host),
 * qualquer tentativa de carregar 'vscode' resultará em um erro de módulo não encontrado.
 */
const mockVscode = {
    window: {
        createOutputChannel: (name: string) => {
            return {
                appendLine: (value: string) => {},
                show: () => {}
            };
        }
    }
};

// Interceptador para carregar o mock do 'vscode' no require do Node.js
const originalRequire = Module.prototype.require;
Module.prototype.require = function (this: any, id: string) {
    if (id === 'vscode') {
        return mockVscode;
    }
    return originalRequire.apply(this, arguments as any);
};
