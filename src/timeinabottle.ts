// @ts-nocheck
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
import { isDate } from 'util';

export class TreeView implements vscode.TreeDataProvider<TreeItem> {
  constructor(public workspaceRoot: string) {



  }

  
  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]>{
      this.refresh();
      return Promise.resolve(this.getElements(element));
    
   
  }

  getElements(element?: TreeItem) : TreeItem[] {

    let workspaces: Folder[] = JSON.parse(fs.readFileSync(this.workspaceRoot, {encoding : "utf-8"}));
  
    
    if(element === undefined) {
      return workspaces.map(workspace => 
        new TreeItem(
          workspace.name, 
          'workspace', 
          workspace.totalTime, 
          workspace.date, 
          vscode.TreeItemCollapsibleState.Collapsed
        ));
    }

    if(element.title === 'workspace') {
      let fold : Folder | undefined = workspaces.find(w => w.name === element.name);
      
      if(fold !== undefined) {
        return fold.subElements.map(sb => new TreeItem(
            sb.name,
            'file',
            sb.totalTime,
            sb.date,
            vscode.TreeItemCollapsibleState.None
      ));
      }
    }

    return [];
  
  }


  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }



}



export class TreeItem extends vscode.TreeItem {
  constructor(
  public name: string,
  public title: string,
  public totalTime: Time,
  public date: Date,
  public readonly collapsibleState: vscode.TreeItemCollapsibleState)
 {
  super(basename(name), collapsibleState);
}


  get tooltip(): string {
    return `${basename(this.name)}-${this.totalTime.hours + " : " + this.totalTime.minutes + " : " + this.totalTime.seconds }`;
  }

  get description(): string {
    return this.totalTime.hours + " : " + this.totalTime.minutes + " : " + this.totalTime.seconds ;
  }

}

