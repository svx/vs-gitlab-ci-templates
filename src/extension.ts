'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { join } from 'path';
import * as gitlab from './utils/gitlab';

let updated = result => gitlab.updateStatus("◉ Gitlab-ci templates up-to-date", 3000)
let inError = err => {
    if (err != null) {
        console.log(`error: ${err.code} - ${err.message}`)
        vscode.window.showErrorMessage(`Updating templates: ${err.code} - ${err.message}`);
    }
}
let gitlabciConfig: vscode.WorkspaceConfiguration
export function activate(context: vscode.ExtensionContext) {

    gitlabciConfig = vscode.workspace.getConfiguration('gitlab-ci');

    gitlab.initTemplates()
        .then(updated)
        .catch(inError)

    let updateTemplates = vscode.commands.registerCommand('extension.updateTemplates', () => {
        if (gitlabciConfig.get("useDefaults")) {
            gitlab.updateTemplates()
                .then(updated)
                .catch(inError)
        }

    });

    let tpl = (filepath) => {
        gitlab.selectTemplate((templates) => {
            vscode.window.showQuickPick(templates)
                .then(value => {
                    if (value) {
                        fs.writeFile(filepath, gitlab.getTemplate(value), (err) => {
                            if (err) throw err;
                            vscode.workspace.openTextDocument(filepath).then(document => {
                                vscode.window.showTextDocument(document)
                            })
                        })
                    }
                })
        })
    }

    let createFromTemplate = vscode.commands.registerCommand('extension.createTemplate', () => {
        if (vscode.workspace.rootPath) {
            let filepath = join(vscode.workspace.rootPath, '.gitlab-ci.yml')
            if (!fs.existsSync(filepath)) {
                tpl(filepath)

            } else {
                vscode.window.showInformationMessage(".gitlab-ci.yml already exists!", "Replace").then(value => {
                    if (value && value == "Replace") {
                        tpl(filepath)
                    }
                })
            }
        }
    });

    let updateConfiguration = vscode.workspace.onDidChangeConfiguration(() => {
        gitlabciConfig = vscode.workspace.getConfiguration('gitlab-ci');
        if (gitlabciConfig.get("useDefaults")) {
            gitlab.initTemplates()
                .then(updated)
                .catch(inError)
        }
    })


    context.subscriptions.push(updateTemplates);
    context.subscriptions.push(createFromTemplate);
    context.subscriptions.push(updateConfiguration);
}

export function deactivate() {
    gitlab.cleanUp()
    gitlab.updateStatus("GitLab-ci template deleted", 3000)
}