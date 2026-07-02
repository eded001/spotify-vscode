import * as vscode from 'vscode';

export class SpotifyPlaylistProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    public isLoggedIn: boolean = false;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!this.isLoggedIn) {
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve([]);
        } else {
            const item1 = new vscode.TreeItem('Músicas Curtidas', vscode.TreeItemCollapsibleState.None);
            item1.iconPath = new vscode.ThemeIcon('heart');

            const item2 = new vscode.TreeItem('Rock Classics', vscode.TreeItemCollapsibleState.None);
            item2.iconPath = new vscode.ThemeIcon('list-music');

            const item3 = new vscode.TreeItem('Descobertas da Semana', vscode.TreeItemCollapsibleState.None);
            item3.iconPath = new vscode.ThemeIcon('radio-tower');

            return Promise.resolve([item1, item2, item3]);
        }
    }
}
