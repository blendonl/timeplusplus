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
  unlink,
  write,
  writeFile,
} from "fs";
import { basename } from "path";
import {  TreeView } from "./timeinabottle";
import { isDate, isRegExp } from "util";
import { getDefaultSettings } from "http2";
import { stringify } from "querystring";
import { time } from "console";
import milliseconds = require("mocha/lib/ms");
import { type } from "os";
import { Element } from "./models/Element";


let workspaces: Folder[];
let interval : NodeJS.Timeout;
let file: File | undefined;

export function activate(context: vscode.ExtensionContext) {


  
  
  
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
    readFile("./timeplusplus.json", { encoding: "utf-8" }, function(err, data) {
      if(err !== null) {
        unlink('./timeplusplus.json', function(err) {
          save();
        });
      }
      else {

        workspaces = JSON.parse(data);
      }
    });
  } else {
    save();
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
    updateAll(file);
    timeFunctions.stop();
    save();
  });

  let treeItems : TreeView = new TreeView('./timeplusplus.json');

  vscode.window.registerTreeDataProvider("timeplusplus", treeItems );

  vscode.commands.registerCommand('timeplusplus.refreshEntry', () =>
    treeItems.refresh()
  );
}
// this method is called when your extension is deactivated
export function deactivate() {}


function newWorkspace(name?: string) : Folder[] | null {
  if(name === null) {
    return null;
  }
  return [{
     name : name ?? '',
     subElements: [],
     isMainFolder: true,
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
  
  let workspace : Folder | undefined;
  
  if(file === undefined) {
    
    if(folderName === '') {
      workspace = workspaces.find(work => work.isMainFolder && work.name === workspaceName);
      
      file = {
        name: fileName,
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
      workspace?.subElements.push(file);

      return file;
    }

  }

  return file;
    
}

// function findFolder(workspaceName: string, folderMain: string, folderName: string) : Folder | undefined{
//   let workspace : Folder | undefined = workspaces.find(work => work.name === workspaceName) ;

//   let folder : Folder | undefined;
//   if(folderMain === '') {
//     folder = workspace?.folders.find(fld => fld.name === folderName);
//   } else {
//     workspace?.folders.forEach(fld => {
      
//       if(folder === undefined) {
//         folder = findFolderInFolder(fld, folderName);
//       }
//     });
//   }


//   return folder;


// }

function findFile(workspaceName: string, folderName: string, fileName: string) : File | undefined{
  
  let file: File | undefined;

  workspaces.forEach(workspace => {
    if(workspace.name === workspaceName) {
      
      if(folderName === '') {
        file = workspace.subElements.find(fl => fl.name === fileName);
      }


    
      let folder: Folder | undefined = workspace.subElements.find(fold => (fold as Folder) && fold.name === folderName) as Folder;
    
      
      if(file !== undefined && folder !== undefined) {
        file = fileExistsInFolder(folder, fileName);
      }
    }
  });

  return file;
}

function fileExistsInFolder(folder: Folder, fileName: string) : File | undefined {
  
  
  let ex: File | undefined = folder.subElements.find(f => f.name === fileName);


  if(ex === null) {
    folder.subElements.forEach(fold => { 
      try {
      return fileExistsInFolder(fold as Folder, fileName);
      } catch(err) {
        console.log(err);
      }
  });

  return ex;

}
}

function findFolderInFolder(mainFolder: Folder, folder: string) : Folder | undefined {

  let ex : Folder | undefined = mainFolder.subElements.find(fld => fld.name === folder) as Folder;

  if(ex === null) {

    mainFolder.subElements.forEach(fld => {return findFolderInFolder(fld as Folder, folder)})

  }

  return ex;

}

function save() {
  writeFile("./timeplusplus.json", JSON.stringify(workspaces), function (err) {
    if (err) console.log(err);
  });
}

function updateAll(file: File | undefined) {

  if(file !== undefined) {

    let folder: Folder | undefined = findFilesFolder(vscode.workspace.name ?? '', file.name);

    let workspace: Folder | undefined = findWorkspace(vscode.workspace.name ?? '');

    if(folder !== undefined) {
      updateTime(folder.totalTime, file.totalTime);
    }

    if(workspace !== undefined) {
      updateTime(workspace.totalTime, file.totalTime);
    }
  }

}

function findFilesFolder(workspaceName: string, fileName: string) : Folder | undefined {

  let workspace: Folder | undefined = workspaces.find(w => w.name === workspaceName);

  

  return workspace?.subElements.find( f => f instanceof Folder && fileExistsInFolder(f, fileName) !==  undefined) as Folder;

}

function findWorkspace(workspaceName: string) : Folder | undefined {
  return workspaces.find(w => w.name === workspaceName);
}


function updateTime(totalTime: Time, time: Time) {
  totalTime.seconds += time.seconds;
  if (totalTime.seconds >= 60) {

    if(totalTime.seconds > 60) {
      totalTime.minutes++;
      totalTime.seconds -= 60;
    } else {
      totalTime.minutes++;
      totalTime.seconds = 0;
    }
  }

  totalTime.minutes += time.minutes;
  
  if (totalTime.minutes >= 60) {
    if(totalTime.minutes > 60) {
      totalTime.hours++;
      totalTime.minutes -= 60;
    } else {
      totalTime.hours++;
      totalTime.minutes = 0;
    }
  }
  
  totalTime.hours += time.hours;

}

