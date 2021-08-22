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
import { basename, dirname } from "path";
import {  TreeView } from "./timeplusplus";
import { isDate, isRegExp } from "util";
import { getDefaultSettings } from "http2";
import { stringify } from "querystring";
import { time } from "console";
import milliseconds = require("mocha/lib/ms");
import { type } from "os";
import { Element } from "./models/Element";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";


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

function addFile(workspaceName: string, fileName: string) : File | undefined{
  
  let folderName : string = getFolderName(fileName); // dirname(fileName);

  let file : File | undefined = findFile(workspaceName, folderName, fileName);

  let workspace : Folder | undefined;
  
  if(file === undefined) {
    
    if(folderName === '.') {
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
    } else {

      let folder: Folder | undefined = findFolder(workspaceName, folderName);

     

      if(folder === undefined) {
         folder = addFolder(workspaceName, folderName) as Folder;
      } 

        
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

        folder.subElements.push(file);

        let wr = workspaces;
      }


    
    return file;
  }

  return file;
    
}


function getFolderName(fileName: string) : string {
  return dirname(vscode.workspace.asRelativePath(fileName));
}

function seperateFolder(folderName: string) : string[] {

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
 


function findFolder(workspaceName: string, folderName: string) {

  let foldersNames: string[] = seperateFolder(folderName);

  let folder : Folder | undefined = workspaces.find(w => w.name === workspaceName) as Folder;



  for(let i = 0; i < foldersNames.length; i++) {

    folder = folder?.subElements.find(f => f.name === foldersNames[i]) as Folder;

  }

  return folder;

  
}

function addFolder(workspaceName: string, folderName: string) : Folder{

  let folder: Folder = findFolder(workspaceName, folderName);

  if(folder === undefined) {

    folder = workspaces.find(w => w.name === workspaceName) as Folder;

    let foldersNames : string[] = seperateFolder(folderName);

    for (let index = 0; index < foldersNames.length; index++) {

      let temp : Folder = folder.subElements.find(f => f.name === foldersNames[0]) as Folder;


      if(temp === undefined) {

        folder.subElements.push(new Folder(foldersNames[0], [], false, new Time(0, 0, 0), new Time(0, 0, 0), new Date()));
        folder = folder.subElements[folder.subElements.length -1] as Folder;
      } else {

        folder = temp;
      }

      
    }

  }

  return folder;
}


















function findFile(workspaceName: string, folderName: string, fileName: string) : File | undefined{
  
  let folder: Folder | undefined = findFolder(workspaceName, folderName);

  return folder?.subElements.find(f => f.name === fileName) as File;
      
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
    if (err) {
      console.log(err);
    }
  });

  console.log();
}

function updateAll(file: File | undefined) {

  if(file !== undefined) {

    let folder: Folder | undefined = findFolder(vscode.workspace.name ?? '', getFolderName(file.name));

    let workspace: Folder | undefined = findWorkspace(vscode.workspace.name ?? '');

    if(folder !== undefined) {
      updateTime(folder.totalTime, file.time);
    }

    if(workspace !== undefined) {
      updateTime(workspace.totalTime, file.time);
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

    totalTime.minutes++;

    totalTime.seconds > 60 ? totalTime.seconds -=60 : totalTime.seconds = 0;
   
  }

  totalTime.minutes += time.minutes;
  
  if (totalTime.minutes >= 60) {
    totalTime.hours++;
    
    totalTime.minutes > 60 ? totalTime.minutes -= 60 :totalTime.minutes = 0;
    
  }
  
  totalTime.hours += time.hours;

}

