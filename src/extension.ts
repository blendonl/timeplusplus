import { TimeFunctions } from "./timeFunctions";
import { Folder } from "./models/folder";
import { File } from "./models/file";
import { Time } from "./models/time";
import * as vscode from "vscode";
import { Utils } from "./utils";
import {
  existsSync,
  readFileSync,
  writeFile,
} from "fs";
import { dirname} from "path";
import {  TreeView } from "./timeplusplus";
import { clearInterval } from "timers";
import { ElementServices } from "./services/elementServices";




let workspaces: Folder[] = [];
let interval : NodeJS.Timeout;
let currentFile: File | undefined;
let currentWorkspace: Folder;
let workspaceName: string;
let timeFunctions: TimeFunctions[] = [];


export function activate(context: vscode.ExtensionContext) {

  // unlink('./timeplusplus.json', function(ee) {  

  // });
  
  //Create status bar item
  let item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  if(vscode.workspace.workspaceFolders !== undefined) {
    workspaceName = vscode.workspace.workspaceFolders[0].uri.path;
  } else {
    workspaceName = 'No Name';
  }

  workspaces = openWorkspaces();

  currentWorkspace = ElementServices.findWorkspace(workspaces, workspaceName) ?? ElementServices.newWorkspace(workspaceName); 


  if(ElementServices.findWorkspace(workspaces, workspaceName) === undefined) {
      
    workspaces.push(currentWorkspace);
  }
  
  

  
  if (vscode.window.activeTextEditor !== undefined) {

    updateWorkspaceName();

    fileOpend(vscode.window.activeTextEditor.document.fileName ?? '', item);
  
  }
  
  let workingFileTimeFunction: TimeFunctions | undefined;
  
  
  vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {

    if(workingFileTimeFunction === undefined || workingFileTimeFunction.file.name !== e.textEditor.document.fileName) {

      workingFileTimeFunction = timeFunctions.find(f => f.file.name === e.textEditor.document.fileName);

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

    
    if(e !== undefined && e.document.fileName !== undefined && e.document.languageId !== 'json') {
      
      updateWorkspaceName();
      
      fileOpend(e.document.fileName, item);
    }
  });



 
  vscode.workspace.onDidCloseTextDocument(function (e: vscode.TextDocument) {

    let relativePath = vscode.workspace.asRelativePath(e.fileName);

    if(!e.fileName.endsWith('.git') && e.fileName.includes('.') && !(relativePath[1] === ':' || relativePath[0] === '/') ) {

      updateWorkspaceName();

      currentFile = ElementServices.findFile(currentWorkspace, getFolderName(e.fileName), e.fileName);

      item.text = "";
      item.show();
      clearInterval(interval);

      let timeFunc = findTimeFunction(e.fileName);

      if(timeFunc !== undefined && timeFunc.isStrarted) {
        timeFunc.stop();
      }

      if(currentFile !== undefined) {
        updateAll(currentFile);
      }
 
      save();
    }
  });

  let treeItems : TreeView = new TreeView('./timeplusplus.json');

  vscode.window.registerTreeDataProvider("timeplusplus", treeItems );

  vscode.commands.registerCommand('timeplusplus.refreshEntry', () =>
    treeItems.refresh()
  );


}
// this method is called when your extension is deactivated
export function deactivate() {



}


function fileOpend(fileName: string, item : vscode.StatusBarItem) {
  
  let relativePath = vscode.workspace.asRelativePath(fileName);

  if(!fileName.endsWith('.git') && fileName.includes('.') && !(relativePath[1] === ':' || relativePath[0] === '/')) {

    currentFile = ElementServices.addFile(currentWorkspace, getFolderName(fileName), fileName);

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

}

function updateWorkspaceName() {
  if(vscode.workspace.workspaceFolders !== undefined) {
    workspaceName = vscode.workspace.workspaceFolders[0].uri.path;
  }    
}

function getFolderName(fileName: string) : string {
  return dirname(vscode.workspace.asRelativePath(fileName));
}


function updateAll(file: File) {

  if(file !== undefined) {

    if(vscode.workspace.workspaceFolders !== undefined) {
      workspaceName = vscode.workspace.workspaceFolders[0].uri.path;
    }

    let folders: Folder[] = ElementServices.findFolders(currentWorkspace, getFolderName(file.name));

    

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

function openWorkspaces(): Folder[]  {
  try {
    if(existsSync('./timeplusplus.json')) {
    
        return JSON.parse(readFileSync('./timeplusplus.json', {encoding: 'utf-8'})) as Folder[];
        //item.text = err;
    } else {
        
       save();
    }
  }
  catch(err) {
  }
  
  return [];
}

function  save() {
  writeFile("./timeplusplus.json", JSON.stringify(workspaces), function (err) {
    if (err) {
      console.log(err);
    }
  });   
}
