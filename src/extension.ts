import { TimeFunctions } from "./timeFunctions";
import { Folder } from "./models/folder";
import { File } from "./models/file";
import * as vscode from "vscode";
import { readFile, writeFile } from "fs";
import { basename, dirname } from "path";
import {  TreeView } from "./timeplusplus";
import { clearInterval } from "timers";
import { ElementServices } from "./services/elementServices";
import { User } from "./models/user";
import { Connect } from './connect';


let interval : NodeJS.Timeout;
let currentFile: File | undefined;
let currentWorkspace: Folder;
let workspaceName: string;
let timeFunctions: TimeFunctions[] = [];
let user: User;
let logs: {type: string, value: string};


export async function activate(context: vscode.ExtensionContext) {

  if(vscode.workspace.name !== undefined) {
    workspaceName = vscode.workspace.name; 
  } else {
    workspaceName = 'No Name';
  }
  

  let auth = await vscode.authentication.getSession('github', []);


  if(auth !== undefined) {
    user = await getUser(auth);
  } else {
      
    user = new User('no name', 'no name', []); 

    readFile('./folders.json', {encoding : 'utf-8'       }, (err, data) => {
      if(data) {
        user.folders = JSON.parse(data);
      }
    });
  }


  let tempcurrentWorkspace = ElementServices.findWorkspace(user.folders, workspaceName); 
  
  if(tempcurrentWorkspace === undefined) {
    currentWorkspace = ElementServices.newWorkspace(workspaceName);
    user.folders.push(currentWorkspace);
  } else {
    currentWorkspace = tempcurrentWorkspace;
  } 

        
  let item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    
  let treeItems : TreeView = new TreeView('./timeplusplus.json', user );

  vscode.window.registerTreeDataProvider("timeplusplus", treeItems );
 
  vscode.commands.registerCommand('timeplusplus.refreshEntry', () =>
    treeItems.refresh()
  );

  
  if (vscode.window.activeTextEditor !== undefined) {

    updateWorkspaceName();

    fileOpend(vscode.window.activeTextEditor.document.fileName ?? '', item);
  
  }
  
  let workingFileTimeFunction: TimeFunctions | undefined;

  
  vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {

    if(workingFileTimeFunction === undefined || workingFileTimeFunction.file.name !== e.textEditor.document.fileName) {

      workingFileTimeFunction = timeFunctions.find(f => f.file.name === basename(e.textEditor.document.fileName));

    }

    if(workingFileTimeFunction !== undefined && workingFileTimeFunction.lastTimeActive > 0) {
      workingFileTimeFunction.lastTimeActive = 0;
  
//      fileOpend(e.textEditor.document.fileName, item);
    }

    
  });



  vscode.window.onDidChangeVisibleTextEditors( (e: vscode.TextEditor[]) => {
    stopTime(e);
  });

  vscode.window.onDidChangeActiveTextEditor( (e: vscode.TextEditor | undefined) => {



   // Connect.addProject(user, currentWorkspace);
    if(e !== undefined && e.document.fileName !== undefined && e.document.languageId !== 'json') {
      
      updateWorkspaceName();
      
      fileOpend(e.document.fileName, item);
    }
  });



 
  vscode.workspace.onDidCloseTextDocument(function (e: vscode.TextDocument) {

    let relativePath = vscode.workspace.asRelativePath(e.fileName);

    if(!e.fileName.endsWith('.git') && e.fileName.includes('.') && !(relativePath[1] === ':' || relativePath[0] === '/') && relativePath.length > 1) {

      updateWorkspaceName();

      currentFile = ElementServices.findFile(currentWorkspace, getFolderName(e.fileName), basename(e.fileName));

      item.text = "";
      item.show();
      clearInterval(interval);

      let timeFunc = findTimeFunction(e.fileName);

      if(timeFunc !== undefined && timeFunc.isStrarted) {
        timeFunc.stop();
      }

      if(currentFile !== undefined) {
       ElementServices.updateAll(currentWorkspace, getFolderName(e.fileName), currentFile);
      }
      
      (auth === undefined) ? save() : Connect.updateWorkspace(user);

    }
  });

  vscode.workspace.onDidRenameFiles((e => {
    e.files.forEach(file => {
      let fl = ElementServices.findFile(currentWorkspace, vscode.workspace.asRelativePath(file.oldUri.path), basename(file.oldUri.path));

      if(fl !== undefined) {
        fl.name = basename(file.newUri.path);
      } else {
        fl = ElementServices.findFolder(currentWorkspace, vscode.workspace.asRelativePath(file.oldUri.path));
        
        if(fl !== undefined) { 
          fl.name = vscode.workspace.asRelativePath(file.newUri.path);
        }
      }

    });

    (auth === undefined) ? save() : Connect.updateWorkspace(user);
  }));
}
// this method is called when your extension is deactivated
export function deactivate() {



}


 async function getUser(auth: vscode.AuthenticationSession) : Promise<User> {
  let user = await Connect.getUser(parseInt(auth.account.id)) ?? new User(auth.account.id, auth.account.label, []);;

  return new Promise((resolve, reject) => {
    if('folders' in user) {
      // if(user.folders.length === 0) {
      //   let result = await Connect.addUser(user);

      // }        
    } else {
      user['folders'] = [] as Folder[];
    }

    resolve(user);
    
  });
}

function addFile(fileName: string) : File | undefined {
  let relativePath = vscode.workspace.asRelativePath(fileName);

  if(!fileName.endsWith('.git') && fileName.includes('.') && !(relativePath[1] === ':' || relativePath[0] === '/')) {

    return ElementServices.addFile(currentWorkspace, getFolderName(fileName), basename(fileName));
  }

}


function fileOpend(fileName: string, item : vscode.StatusBarItem) {
  
  let currentFile = addFile(fileName);
    if(currentFile !== undefined) {

      let timeFunc = findTimeFunction(currentFile.name);

      if(timeFunc === undefined) {
        timeFunctions.push(new TimeFunctions(currentFile));

        timeFunc = timeFunctions[timeFunctions.length -1];
      }
    
      clearInterval(interval);
      
      if(!timeFunc.isStrarted) {

        timeFunc.start();
      }

      interval = setInterval(() => {
          
        if(timeFunc !== undefined) {
          if(timeFunc?.lastTimeActive > 15) {
            clearInterval(interval);
            timeFunc.stop();
          }

          if(timeFunc.isStrarted) {
            timeFunc?.updateTime();
          }
        
        }
        item.text = timeFunc?.isStrarted ? timeFunc?.getTime() ?? '0:0:0' : 'Paused';
        item.show();
      }, 1000);
    
    }
  

}

function updateWorkspaceName() {
  if(vscode.workspace.name !== undefined) {
    workspaceName = vscode.workspace.name;
  }    
}

function getFolderName(fileName: string) : string {
  return dirname(vscode.workspace.asRelativePath(fileName));
}

function findTimeFunction(fileName: string) : TimeFunctions | undefined {
  let timeFunc : TimeFunctions | undefined =  timeFunctions.find(tf => tf.file.name === fileName);

  if(timeFunc === undefined) {
    return undefined;
  }

  return timeFunc;
}


function stopTime(textEditors: vscode.TextEditor[]) {

  timeFunctions.forEach(tm => {
    if(textEditors.find(tx => tx.document.fileName === tm.file?.name ?? '') === undefined) {
      if(tm.isStrarted) {
        tm.stop();
      }
    } else {
      if(!tm.isStrarted) {
        tm.start();
      }
    }
  });

}


function  save() {
  writeFile('./timeplusplus.jon', JSON.stringify(user.folders), (err) => {

  }); 
}
