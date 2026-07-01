import * as assert from 'assert';

// Você pode importar e usar todas as APIs do módulo 'vscode'
// bem como importar a sua extensão para testá-la
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Suíte de Testes da Extensão', () => {
	vscode.window.showInformationMessage('Iniciando todos os testes.');

	test('Teste de exemplo', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
