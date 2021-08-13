import { TimeFunctions } from "./timeFunctions";
import { Workspace } from "./models/workspace";
import { Folder } from "./models/folder";
import { File } from "./models/file";
import { Time } from "./models/time";
import * as vscode from "vscode";
import {
  access,
  constants,
  existsSync,
  fstat,
  open,
  readFile,
  readFileSync,
  write,
  writeFile,
} from "fs";
import { basename } from "path";
import { TimeInABottle } from "./timeinabottle";
import { isDate, isRegExp } from "util";
import { getDefaultSettings } from "http2";
import { stringify } from "querystring";
import { time } from "console";
import milliseconds = require("mocha/lib/ms");


let workspaces: Workspace[];
let interval : NodeJS.Timeout;
let file: File;

export function activate(context: vscode.ExtensionContext) {

  let files: File[] = [
    {
      fileName: '',
      time: {
        hours: 0,
        minutes: 0,
        seconds: 0
      },
      totalTime: {
        hours: 0,
        minutes: 0,
        seconds: 0
      },
      date: new Date()
    }
  ];

  let file = files.find(fl => fl.fileName === '');

  if(file !== undefined) {
    file.fileName = 'aa';
  }
  
  //Create status bar item
  let item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  
  
  //Read workspace
  workspaces = newWorkspace(vscode.workspace.name) ?? [];

  if (existsSync("./timeplusplus.json") && 
        new Promise((resolve, reject) => {
          access("./timeplusplus.json", constants.F_OK, (err) => {
            err ? reject(false) : resolve(true);
        });
  })) {
    workspaces = JSON.parse(readFileSync("./timeplusplus.json", { encoding: "utf-8" }));
  } else {
    writeFile("./timeplusplus.json", JSON.stringify(workspaces), function (err) {
      if (err) console.log(err);
    });
  }

  
  let timeFunctions: TimeFunctions;

  if (vscode.window.activeTextEditor !== undefined) {
    file = addFile(
      vscode.workspace.name ?? '',
      '',
      vscode.window.activeTextEditor.document.fileName ?? ''
    );

    if(file !== undefined) {
      
      timeFunctions = new TimeFunctions(file);
      timeFunctions.start();
      interval = setInterval(() => {
        item.text = timeFunctions.getTime();
        item.show();
      }, 1000);
    }
  }
  /*
    time = new Time(fl.time.hours, fl.time.minutes, fl.time.seconds);
    time.start();
    interval = setInterval(function () {
      item.text = time.getTime();
      item.show();
    }, 1000);
    */

  vscode.workspace.onDidOpenTextDocument(function (e: vscode.TextDocument) {
    file = addFile(
      vscode.workspace.name ?? '',
      vscode.workspace.workspaceFile?.path ?? '',
      e.fileName,
    );

    if(file !== undefined) {

      timeFunctions.stop();
      timeFunctions.file = file;
      timeFunctions.start();
      interval = setInterval(() => {
        item.text = timeFunctions.getTime();
        item.show();
      }, 1000);
    }
  })
  

  vscode.workspace.onDidCloseTextDocument(function (e: vscode.TextDocument) {
    item.text = "";
    item.show();
    clearInterval(interval);
    save();
    timeFunctions.stop();
   // timeFunctions.stop();
   // updateFile(file.fileName, "", vscode.workspace.name === undefined ? "" : vscode.workspace.name, workspaces, file.time);
  });


  vscode.window.registerTreeDataProvider("timeinabottle", new TimeInABottle(vscode.workspace.rootPath === undefined ? "" : vscode.workspace.rootPath))
  vscode.window.createTreeView("timeinabottle", {
    treeDataProvider: new TimeInABottle(vscode.workspace.rootPath === undefined ? "" : vscode.workspace.rootPath)
  });
}
// this method is called when your extension is deactivated
export function deactivate() {}


function newWorkspace(name?: string) : Workspace[] | null {
  if(name === null) {
    return null;
  }
  return [{
     workspaceName : name ?? '',
     folders: [],
     files:[],
     time: {
       hours : 0,
       minutes: 0,
       seconds: 0
     },
     totalTime: {
       hours: 0,
       minutes: 0,
       seconds: 0,
     },
     date: new Date(),
  }];

  
}

function addFile(workspaceName: string, folderName: string, fileName: string) : File | undefined{
  let file : File | undefined = findFile(workspaceName, folderName, fileName);
  let workspace : Workspace | undefined;
  if(file === undefined) {
    
    if(folderName === '') {
      workspace = workspaces.find(work => work.workspaceName === workspaceName);
      
      file = {
        fileName: fileName,
        time: {
          hours: 0,
          minutes: 0,
          seconds: 0
        },
        totalTime: {
          hours: 0,
          minutes: 0,
          seconds: 0
        },
        date: new Date()
      };
      workspace?.files.push(file);

      return file;
    }
    
    let folder: Folder | undefined = findFolder(workspaceName, '', folderName);

  }

  return file;
    
}

function findFolder(workspaceName: string, folderMain: string, folderName: string) : Folder | undefined{
  let workspace : Workspace | undefined = workspaces.find(work => work.workspaceName === workspaceName) ;

  let folder : Folder | undefined;
  if(folderMain === '') {
    folder = workspace?.folders.find(fld => fld.folderName === folderName);
  } else {
    workspace?.folders.forEach(fld => {
      
      if(folder === undefined) {
        folder = findFolderInFolder(fld, folderName);
      }
    });
  }


  return folder;


}

function findFile(workspaceName: string, folderName: string, fileName: string) : File | undefined{
  
  let file: File | undefined;

  workspaces.forEach(workspace => {
    if(workspace.workspaceName === workspaceName) {

      if(folderName === '') {
        file = workspace.files.find(fl => fl.fileName === fileName);
      }


    
      let folder: Folder | undefined = workspace.folders.find(fold => fold.folderName === folderName);
    
      
      if(file !== undefined && folder !== undefined) {
        file = fileExistsInFolder(folder, fileName);
      }
    }
  });

  return file;
}

function fileExistsInFolder(folder: Folder, fileName: string) : File | undefined {
  
  
  let ex: File | undefined = folder.files.find(f => f.fileName === fileName);


  if(ex === null) {
    folder.folders.forEach(fold => { return fileExistsInFolder(fold, fileName)});
  }

  return ex;

}

function findFolderInFolder(mainFolder: Folder, folder: string) : Folder | undefined {

  let ex : Folder | undefined = mainFolder.folders.find(fld => fld.folderName === folder);

  if(ex === null) {

    mainFolder.folders.forEach(fld => {return findFolderInFolder(fld, folder)})

  }

  return ex;

}

function save() {
  writeFile("./workspaces.json", JSON.stringify(workspaces), function (err) {
    if (err) console.log(err);
  });
}