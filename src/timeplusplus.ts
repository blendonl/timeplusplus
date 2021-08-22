// @ts-nocheck
import { basename } from 'path';
import { Time } from './models/time';
import { Folder } from './models/folder';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { Element } from './models/Element';
export class TreeView implements vscode.TreeDataProvider<TreeItem> {
  constructor(public workspaceRoot: string) {



  }

  
  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]>{
     
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

  
      let fold : Folder | undefined = element.title === 'workspace' ? this.findFolder('Client','.') : this.findFolder('Client', element.name);

      let a : Element = workspaces[0] as Element;

      let b = a as Folder;

      
      if(fold !== undefined) {
        return fold.subElements.map(sb => 'subElements' in sb ? new TreeItem(sb.name, 'folder', sb.totalTime, sb.date, vscode.TreeItemCollapsibleState.Collapsed) : new TreeItem(
            sb.name,
            'file',
            sb.totalTime,
            sb.date,
            vscode.TreeItemCollapsibleState.None
      ));
        }

  
  }


  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }



   seperateFolder(folderName: string) : string[] {

    let strings : string[] = [];
    let i = 0;
    let count = 0;
      for (let index = 0; index < folderName.length; index++) {
        if(folderName[index] === '\\' || folderName[index] === '/') {
          count++;
          
        
            strings.push(folderName.slice(i, index));
            i = index + 1;
          }
        
  
      }
  
      strings.push(folderName.slice(i, folderName.length));
  
      return strings;
  }
   
  
  
 findFolder(workspaceName: string, folderName: string) {

  let workspaces: Folder[] = JSON.parse(fs.readFileSync(this.workspaceRoot, {encoding : "utf-8"}));
  
    let foldersNames: string[] = this.seperateFolder(folderName);
  
    let folder : Folder | undefined = workspaces.find(w => w.name === workspaceName) as Folder;
  
  
    if(folderName !== '.') {
  
     for(let i = 0; i < foldersNames.length; i++) {
  
        folder = folder?.subElements.find(f => f.name === foldersNames[i]) as Folder;
      
      }
    }
  
    return folder;
  
    
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

