import { basename } from 'path';
import { Time } from './models/time';
import { File } from './models/file';
import { Folder } from './models/folder';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {Workspace} from './models/workspace';
import { deepStrictEqual } from 'assert';
import { type } from 'os';

export class TimeInABottle implements vscode.TreeDataProvider<Element> {
  constructor(public workspaceRoot: string) {}

  
  getTreeItem(element: Element): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Element): Thenable<Element[]>{
    
   
      return Promise.resolve(this.getElements(element));
    
   
  }

  getElements(element?: Element) {

    let folders: Workspace = JSON.parse(fs.readFileSync(this.workspaceRoot, {encoding : "utf-8"}));
  
  
    return [];
  
  }



}



export class Element extends vscode.TreeItem {
  constructor(
  public workspaceName: string,
  public elements: Element[],
  public time: Time,
  public totalTime: Time,
  public date: Date,
  public readonly collapsibleState: vscode.TreeItemCollapsibleState)
 {
  super(basename(workspaceName), collapsibleState)
}
    get tooltip(): string {
    return `${basename(this.workspaceName)}-${this.time.hours + " : " + this.time.minutes + " : " + this.time.seconds }`;
  }

  get description(): string {
    return this.time.hours + " : " + this.time.minutes + " : " + this.time.seconds ;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}

