import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.tasks.registerTaskProvider("idris2dart", new Idris2DartTaskProvider())
	);
}

class Idris2DartTaskProvider implements vscode.TaskProvider {

	provideTasks(token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
		return findTasks(token);
	}

	resolveTask(task: vscode.Task, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task> {
		const taskName = task.definition.task;
		if (taskName) {
			const definition: Idris2DartTaskDefinition = <any>task.definition;
			return idris2dartTaskFor(definition, idris2dartPath());
		}
		return undefined;
	}
}

interface Idris2DartTaskDefinition extends vscode.TaskDefinition {
	task: string;
	packageFile?: string;
}

// this method is called when your extension is deactivated
export function deactivate() { }

async function findTasks(token: vscode.CancellationToken) {
	const idris2dart: string = idris2dartPath();
	const files = await vscode.workspace.findFiles("*.ipkg", undefined, undefined, token);
	return files.map((uri, _index, _array) => {
		const definition: Idris2DartTaskDefinition = {
			type: 'idris2dart',
			task: 'build',
			packageFile: uri.fsPath
		};
		return idris2dartTaskFor(definition, idris2dart);
	});
}

function idris2dartTaskFor(definition: Idris2DartTaskDefinition, idris2dart: string) {
	const taskName = definition.task;
	const taskGroup = vscode.TaskGroup.Build;
	const packageFile = definition.packageFile!;
	const packageDir = path.dirname(packageFile);
	const packageFileName = path.basename(packageFile);
	const task = new vscode.Task(
		definition,
		vscode.TaskScope.Workspace,
		`${taskName} ${packageFileName}`,
		'idris2dart',
		new vscode.ShellExecution(`${idris2dart} --${taskName} ${packageFileName}`, {
			cwd: packageDir
		})
	);
	task.group = taskGroup;
	return task;
}

function idris2dartPath(): string {
	const extensionConfig = vscode.workspace.getConfiguration("idris2dart");
	return extensionConfig.get("path") || "idris2dart";
}
