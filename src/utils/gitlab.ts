
import * as fs from 'fs';
import { join } from 'path';
import * as git from './git';
import { window, workspace, StatusBarAlignment } from 'vscode';
import { exec as ex } from 'child_process';

let cb = (err, result, args) => {
  if (err != null) {
    console.log(`error: ${err.code} - ${err.message}`)
  }
}

export function initTemplates(): Promise<{}> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(git.defaultTemplatesFolder)) {
      updateStatus("○ Initializing GitLab-ci templates")
      git.init(git.defaultTemplatesFolder)
        .then(result => {
          git.withRootpath(git.defaultTemplatesFolder)
        })
        .catch(err => {
          console.error(`error: ${err.code} - ${err.message}`)
          updateStatus()
        })


      git.addRemote("origin", git.gitlabURL)
        .then(result => {
          git.setConfig("core.sparsecheckout", "true")
            .then(result => {
              git.appendToSparseCheckout(["vendor/gitlab-ci-yml/*"])
                .then(result => {
                  updateStatus("○ Updating GitLab-ci templates")
                  git.pull("origin", "master", "--depth=1")
                    .then(result => resolve(result))
                    .catch(err => reject(err))
                })
                .catch(err => {
                  if (err != null) {
                    console.error(`error: ${err.code} - ${err.message}`)
                    updateStatus()
                  }
                })
            })
        })
        .catch(err => {
          if (err != null) {
            if (err.code != 128) {
              console.error(`error: ${err.code} - ${err.message}`)
              updateStatus()
            }
          }
        })

    } else {
      updateTemplates()
        .then(result => resolve(result))
        .catch(err => reject(err))
    }
  });
}

const status = window.createStatusBarItem(StatusBarAlignment.Right, 100);
export function updateStatus(text?: string, ms?: number): void {
  if (text) {
    status.text = text;
    status.show();
    if (ms) {
      delay(ms).then(() => {
        status.hide();
      })
    }
  } else {
    status.hide();
  }
}


function delay(ms): Promise<{}> {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, ms);
  });
}


export function updateTemplates(): Promise<{}> {
  return new Promise((resolve, reject) => {
    updateStatus("○ Fetching GitLab-ci templates")
    git.withRootpath(git.defaultTemplatesFolder)
    git.diff("origin", "master", "vendor/gitlab-ci-yml/")
      .then(result => {
        if (result !== "") {
          window.showInformationMessage("New templates available", "Update").then(value => {
            if (value == "Update") {
              updateStatus("○ Updating GitLab-ci templates")
              git.merge("origin/master", "")
                .then(r => resolve(r))
                .then(e => reject(e))
            } else {
              updateStatus()
            }
          })
        } else {
          resolve()
        }
      })
      .catch(err => {
        if (err != null) {
          console.log(`error: ${err.code} - ${err.message}`)
          window.showErrorMessage(`Updating templates: ${err.code} - ${err.message}`);
          updateStatus()
        }
      })
  })
}

export function selectTemplate(cb) {
  var files = fs.readdirSync(git.defaultTemplatesFolder + "/vendor/gitlab-ci-yml/");
  cb(files.filter(f => { return /.+\.gitlab-ci.yml/.test(f) }))
}

export function getTemplate(name) {
  return fs.readFileSync(git.defaultTemplatesFolder + "/vendor/gitlab-ci-yml/" + name)
}

export function cleanUp() {
  fs.rmdirSync(git.defaultTemplatesFolder)
}


