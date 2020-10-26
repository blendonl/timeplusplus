import { basename } from 'path';
import { Time } from './time';
import { File } from './file';
import { Folder } from './folder';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {Workspace} from './workspace';
import { deepStrictEqual } from 'assert';
import { type } from 'os';

export class TimeInABottle implements vscode.TreeDataProvider<Workspacer | Folderr | Filer> {
  constructor(private workspaceRoot: string) {}

  
  getTreeItem(element: Workspacer | Folderr | Filer): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Workspacer | Folderr | Filer): Thenable<Workspacer[] | Folderr[] | Filer[]>{
    if (element === undefined) {
      return Promise.resolve(
       this. getFoldersInWorkspacesJson(
            './workspaces.json'
        )
      );
      //if (this.pathExists(workspacesPath)) {
      //  let workspaces: JSON = JSON.parse(fs.readFileSync("./workspaces.json", { encoding: "utf-8" }))
      //  return Promise.resolve(workspaces);
      } else {

        if(element.folderName === undefined) {
          return Promise.resolve(
            this.getFoldersInWorkspace(element)
          )
        } else {
          return Promise.resolve(
           this.getFilesInFolder(element)
        )
      }
    }
  }


getFoldersInWorkspace(workspace?: Workspacer | Folderr | Filer | undefined): Folderr[] {
  if(workspace   !== undefined && workspace.workspaceName !== undefined) {
      const toFolder = (folderName: string, files: Filer[], folders: Folderr[], time: Time, totalTime: Time, date: Date): Folderr=> {
          return new Folderr(
            folderName,
            files,
            folders,
            time,
            totalTime,
            date,
            vscode.TreeItemCollapsibleState.Collapsed
          );
      }
      let folders: Folderr[] = [];
      workspace.folders.forEach((value, index) => {
          folders.push(toFolder(value.folderName,this.toFilers(value.files),this.toFolderr(value.folders), value.time, value.totalTime, value.date))
      });

      return folders;
    } else return []

}

    private getFilesInFolder(folder: Workspacer | Folderr | Filer | undefined) : Filer[] {
      if(folder !== undefined && folder.folderName !== undefined) {
      const toFiler = (fileName: string, time: Time, totalTime: Time, date: Date): Filer => {
          return new Filer(
            fileName,
            time,
            totalTime,
            date,
            vscode.TreeItemCollapsibleState.None
          );
      }
      let filers: Filer[] = [];
       folder.files.forEach(value => {
       filers.push(value)
       });
       return filers;
      } else return []
      }


  
    private getTime(element: Filer): Timer[] {
     let  time: Time = element.time;

     const toTimer = (hours: number, minutes: number, seconds: number) : Timer => {
       
      return new Timer(hours, minutes, seconds, vscode.TreeItemCollapsibleState.None)
     }
     
     let timers: Timer[]= [];
    
     timers.push(toTimer(time.hours, time.minutes, time.seconds))
     return timers
    }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getFoldersInWorkspacesJson(workspacesJsonPath: string): Workspacer[] {
    if (this.pathExists(workspacesJsonPath)) {
      const workspaces: Workspace[] = JSON.parse(fs.readFileSync(workspacesJsonPath, 'utf-8'));

      let workspace: Workspacer[] = this.toWorkspaces(workspaces)
      return workspace;
    } else {
      return [];
    }
  }

  private toWorkspaces(workspaces: Workspace[]): Workspacer[] {

      const toWorkspace = (workspaceName: string, folders: Folderr[], time: Time, totalTime: Time, date: Date): Workspacer=> {
          return new Workspacer(
            workspaceName,
            folders,
            time,
            totalTime,
            date,
            vscode.TreeItemCollapsibleState.Collapsed
          );
      }
      let workspacers: Workspacer[] = [];
      workspaces.forEach((value, index) => {
          workspacers.push(toWorkspace(value.workspaceName,this.toFolderr(value.folders), value.time, value.totalTime, value.date))
      });

      return workspacers;
  }
  



 private toFilers(files: File[]) {

      const toFiler = (fileName: string, time: Time, totalTime: Time, date: Date): Filer => {
          return new Filer(
            fileName,
            time,
            totalTime,
            date,
            vscode.TreeItemCollapsibleState.None
          );

      }
       let filers: Filer[] = [];
       files.forEach(value => {
            filers.push(toFiler(value.fileName, value.time, value.totalTime, value.date))
       });
       return filers;
  }

  private toFolderr(folder: Folder[]) {
    
      const toFolder = (folderName: string, files: Filer[], folders: Folderr[], time: Time, totalTime: Time, date: Date): Folderr=> {
          return new Folderr(
            folderName,
            files,
            folders,
            time,
            totalTime,
            date,
            vscode.TreeItemCollapsibleState.Collapsed
          );
      }
      let folders: Folderr[] = [];
      folder.forEach((value, index) => {
          folders.push(toFolder(value.folderName,this.toFilers(value.files),this.toFolderr(value.folders), value.time, value.totalTime, value.date))
      });

      return folders;
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}

export class Timer extends vscode.TreeItem {
  constructor(
    public hours: number,
    public minutes: number,
    public seconds: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState 
  ) {
    super( collapsibleState)    
  }
    get tooltip(): string {
    return `${this.hours}-${this.hours}`;
  }

  get description(): string {
    return this.hours + "";
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}

export class Folderr extends vscode.TreeItem {
  constructor(
    public folderName: string,
    public files: Filer[],
    public folders: Folderr[],
    public time: Time,
    public totalTime: Time,
    public date: Date,
  public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(basename(folderName) , collapsibleState)
  }
    get tooltip(): string {
    return `${basename(this.folderName)}-${this.time.hours + " : " + this.time.minutes + " : " + this.time.seconds }`;
  }

  get description(): string {
    return this.time.hours + " : " + this.time.minutes + " : " + this.time.seconds ;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}

export class Filer extends vscode.TreeItem {
  constructor(public fileName: string,
  public time: Time,
  public totalTime: Time,
  public date: Date,
  public readonly collapsibleState: vscode.TreeItemCollapsibleState)
 {
  super(basename(fileName), collapsibleState)
}
    get tooltip(): string {
    return `${basename(this.fileName)}-${this.time.hours + " : " + this.time.minutes + " : " + this.time.seconds }`;
  }

  get description(): string {
    return this.time.hours + " : " + this.time.minutes + " : " + this.time.seconds ;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
} 
export class Workspacer extends vscode.TreeItem {
  constructor(
  public workspaceName: string,
  public folders: Folderr[],
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

