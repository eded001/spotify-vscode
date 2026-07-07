import * as vscode from 'vscode';

/**
 * Gerencia a gravação de logs da extensão em um canal de saída do VS Code.
 * Também faz o espelhamento das mensagens de log no console padrão do Node.js/VS Code Extension Host.
 */
class Logger {
    private channel: vscode.OutputChannel | null = null;

    /**
     * Inicializa o canal de logs nomeado como "Spotify Player".
     */
    initialize() {
        this.channel = vscode.window.createOutputChannel('Spotify Player');
        this.info('Canal de logs "Spotify Player" inicializado.');
    }

    /**
     * Formata e envia a mensagem de log para o canal de saída do VS Code e para o console.
     * 
     * @param level O nível do log (ex: INFO, WARN, ERROR, DEBUG).
     * @param message A mensagem a ser registrada.
     */
    private log(level: string, message: string) {
        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] [${level}] ${message}`;
        if (this.channel) {
            this.channel.appendLine(formatted);
        }
        // Exibir logs também no console de depuração do VS Code Extension Host
        if (level === 'ERROR') {
            console.error(formatted);
        } else if (level === 'WARN') {
            console.warn(formatted);
        } else {
            console.log(formatted);
        }
    }

    /**
     * Registra uma mensagem de informação.
     * 
     * @param message Mensagem informativa.
     */
    info(message: string) {
        this.log('INFO', message);
    }

    /**
     * Registra um aviso.
     * 
     * @param message Mensagem de aviso.
     */
    warn(message: string) {
        this.log('WARN', message);
    }

    /**
     * Registra um erro e formata detalhes extras ou stack trace quando fornecidos.
     * 
     * @param message Mensagem de erro descritiva ou uma instância do objeto Error.
     * @param error Objeto de erro opcional ou qualquer contexto do erro.
     */
    error(message: string | Error, error?: any) {
        let msg = '';
        if (message instanceof Error) {
            msg = message.stack || message.message;
        } else {
            msg = message;
            if (error) {
                if (error instanceof Error) {
                    msg += `\nErro: ${error.message}\nStack trace: ${error.stack}`;
                } else {
                    msg += `\nDetalhes do erro: ${JSON.stringify(error)}`;
                }
            }
        }
        this.log('ERROR', msg);
    }

    /**
     * Registra uma mensagem para fins de depuração (debug).
     * 
     * @param message Mensagem de depuração.
     */
    debug(message: string) {
        this.log('DEBUG', message);
    }

    /**
     * Revela o canal de saída "Spotify Player" no painel Output do VS Code.
     */
    show() {
        if (this.channel) {
            this.channel.show();
        }
    }
}

export const logger = new Logger();
