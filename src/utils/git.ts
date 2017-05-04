'use strict';

import { exec as ex, ExecOptions, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

var rootPath: string

export function withRootpath(rp: string) {
  rootPath = rp
}

function exec(command: string, options: ExecOptions): Promise<{}> {
  return new Promise((resolve, reject) => {
    ex(command, options, (err, stdout, stderr) => {
      err ? reject(err) : resolve(stdout)
    })
  })
}

export function run(args): Promise<{}> {
  console.log('git.exec: ' + args.join(' '));
  args.unshift('git')

  return exec(args.join(' '), {
    cwd: rootPath
  })
};


export function clone(repoUrl, dest, args): Promise<{}> {
  return run(['clone', args, repoUrl, dest]);
};

export function init(directory): Promise<{}> {
  return run(["init", directory])
}

export function addRemote(name, url): Promise<{}> {
  return run(["remote", "add", name, "-f", url])
}

export function setConfig(key, value, isGlobal: boolean = false): Promise<{}> {
  var args = ["config", key, value]
  if (isGlobal) args.splice(1, 0, "--global");
  return run(args)
}

export function fetch(remote, branch, args): Promise<{}> {
  return run(['fetch', remote, branch, args]);
}

export function diff(remote, branch, folder): Promise<{}> {
  return new Promise((resolve, reject) => {
    fetch(remote, branch, "--depth=1").then(result => {
      run(['--no-pager', 'diff', branch, '--', folder, `${remote}/${branch}`, '--', folder])
        .then(result => { resolve(result) })
        .catch(err => reject(err))
    })
  });
}

export function merge(remoteBranch, args): Promise<{}> {
  return run(["merge", args, remoteBranch])
}

export function pull(remote, branch, args): Promise<{}> {
  return run(["pull", args, remote, branch])
}

export function appendToSparseCheckout(folders): Promise<{}> {
  console.log('git.appendToSparseCheckout');
  return Promise.all(folders.map(appendTo))
}

function appendTo(f): Promise<{}> {
  return new Promise((resolve, reject) => {
    exec(`echo "${f}" >> .git/info/sparse-checkout`, {
      cwd: rootPath
    })
      .then(result => resolve(result))
      .catch(err => reject(err))
  })
}