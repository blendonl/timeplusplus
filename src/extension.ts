import { TimeFunctions } from "./timeFunctions";
import { Folder } from "./models/folder";
import { File } from "./models/file";
import { Time } from "./models/time";
import * as vscode from "vscode";
import { Utils } from "./utils";
import { writeFile } from "fs";
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


export async function activate(context: vscode.ExtensionContext) {
  
  let workspace;
  
  if(vscode.workspace.workspaceFolders !== undefined) {
    workspaceName = vscode.workspace.workspaceFolders[0].uri.path;
    workspace = vscode.workspace.workspaceFolders[0];
  } else {
    workspaceName = 'No Name';
  }
  

  let ghAuth = await vscode.authentication.getSession('github', []);

  if(ghAuth !== undefined) {

   
    
    user = await Connect.getUser(parseInt(ghAuth.account.id)) ?? new User(ghAuth.account.id, ghAuth.account.label, []);;
    if('folders' in user) {
      if(user.folders.length === 0) {
        let result = await Connect.addUser(user);
      }        
    } else {
      user['folders'] = [] as Folder[];
    }


    currentWorkspace = ElementServices.findWorkspace(user.folders, workspaceName) ?? ElementServices.newWorkspace(workspaceName); 
    
  
  }
  


  // if(workspace !== undefined) {

  // vscode.workspace.findFiles(
  //   '**/*.*',
  //   '**/node_modules/**'
  // ).then((value : vscode.Uri[]) => {
    
    //   value.forEach(val => addFile(val.path));
    // }, ((resa) => {
      //   let a = resa;
      // }));
      // }
      
      
      
      
      // unlink('./timeplusplus.json', function(ee) {  
        
        // });
        
        //Create status bar item
        
  
        
  let item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    
  let treeItems : TreeView = new TreeView('./timeplusplus.json', user);

  vscode.window.registerTreeDataProvider("timeplusplus", treeItems );

  vscode.commands.registerCommand('timeplusplus.refreshEntry', () =>
    treeItems.refresh()
  );
          
          

  if(ElementServices.findWorkspace(user.folders, workspaceName) === undefined) {
      
    user.folders.push(currentWorkspace);
    if(user !== undefined) {
      //Connect.addProject(user, currentWorkspace);
    }
  }
  
  

  
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
  
      fileOpend(e.textEditor.document.fileName, item);
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
        updateAll(currentFile, e.fileName);
      }
      
     // Connect.updateProject(user, currentWorkspace);
      //save();

      Connect.updateWorkspace(user);
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
          fl.name = vscode.workspace.asRelativePath(file.newUri.path)
          ;
        }
      }

    });

    save();
  }));




}
// this method is called when your extension is deactivated
export function deactivate() {



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
  if(vscode.workspace.workspaceFolders !== undefined) {
    workspaceName = vscode.workspace.workspaceFolders[0].uri.path;
  }    
}

function getFolderName(fileName: string) : string {
  return dirname(vscode.workspace.asRelativePath(fileName));
}


function updateAll(file: File, fileName: string) {

  if(file !== undefined) {

    if(vscode.workspace.workspaceFolders !== undefined) {
      workspaceName = vscode.workspace.workspaceFolders[0].uri.path;
    }

    let folders: Folder[] =   ElementServices.findFolders(currentWorkspace, getFolderName(fileName));

    

    if(folders !== []) {
      
      for (let index = folders.length - 1; index >= 0; index--) {
        
        folders[index].totalTime = getTime(folders[index]).totalTime;
        
        folders[index].time = getTime(folders[index]).time;


      }
    
    }

    if(currentWorkspace !== undefined) {
      currentWorkspace.totalTime = getTime(currentWorkspace).totalTime;
      
      currentWorkspace.time = getTime(currentWorkspace).time;
    }

    
  }

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

function getTime(folder: Folder) : {time: Time, totalTime: Time} {
  let time: Time = new Time(0, 0, 0);
  let totalTime: Time = new Time(0, 0, 0);
   folder.subElements.forEach(s => {    
     Utils.addTime(time, s.time);
     Utils.addTime(totalTime, s.totalTime);
  });

  return { time : time, totalTime: totalTime};
}



function  save() {
  writeFile("./timeplusplus.json", JSON.stringify(user.folders), function (err) {
    if (err) {
      console.log(err);
    }
  });   
}
