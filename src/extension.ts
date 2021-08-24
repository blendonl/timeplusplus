import { TimeFunctions } from "./timeFunctions";
import { Folder } from "./models/folder";
import { File } from "./models/file";
import { Time } from "./models/time";
import * as vscode from "vscode";
import { Utils } from "./utils";
import {
  existsSync,
  readFileSync,
  unlink,
  writeFile,
} from "fs";
import { dirname } from "path";
import {  TreeView } from "./timeplusplus";




let workspaces: Folder[];
let interval : NodeJS.Timeout;
let file: File | undefined;
let workspaceName: string;

export function activate(context: vscode.ExtensionContext) {

  unlink('./timeplusplus.json', function(ee) {  

  });
  
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

  workspaces = [];

    if(existsSync('./timeplusplus.json')) {
      
      try {
      workspaces = JSON.parse(readFileSync('./timeplusplus.json', {encoding: 'utf-8'},));
      }catch(err) {
        item.text = err;
      }
    } else {
      try {
      save();

      } catch(err) {
        item.text = err;
      }
    }

    if(findWorkspace(workspaceName) === undefined) {
      
      workspaces.push(newWorkspace(workspaceName ?? 'No Name'));
    }
  
  
  //Read workspace

 
  
  let timeFunctions: TimeFunctions;

  if (vscode.window.activeTextEditor !== undefined) {
    file = addFile(
      workspaceName ?? '',
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

    

    if(!e.fileName.endsWith('.git') && e.fileName.includes('.') && e.languageId !== 'jsonc') {
    file = addFile(
      workspaceName ?? '',
      e.fileName,
    );

    if(file !== undefined) {
      if(timeFunctions !== undefined) {
        timeFunctions.stop();
      } else {
        timeFunctions = new TimeFunctions(file);
      }
      timeFunctions.stop();
      timeFunctions.file = file;
      timeFunctions.start();
      interval = setInterval(() => {
        item.text = timeFunctions.getTime();
        item.show();
      }, 1000);
    
    }
    }
  });
  

  vscode.workspace.onDidCloseTextDocument(function (e: vscode.TextDocument) {

    if(!e.fileName.endsWith('.git') && e.fileName.includes('.')) {
    item.text = "";
    item.show();
    clearInterval(interval);
    updateAll(file);
    timeFunctions.stop();
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
export function deactivate() {}


function newWorkspace(name: string) : Folder {
  return {
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
  };

  
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

function seperateFolder(folderName: string, startIndex: number) : string[] {

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

  let foldersNames: string[] = seperateFolder(folderName, 0);

  let folder : Folder | undefined = workspaces.find(w => w.name === workspaceName) as Folder;



  for(let i = 0; i < foldersNames.length; i++) {

    folder = folder?.subElements.find(f => f.name === Utils.mergeFolderNames(foldersNames, 0, i )) as Folder;

  }

  return folder;

  
}

function addFolder(workspaceName: string, folderName: string) : Folder{

  let folder: Folder = findFolder(workspaceName, folderName);

  if(folder === undefined) {

    folder = workspaces.find(w => w.name === workspaceName) as Folder;

    let foldersNames : string[] = seperateFolder(folderName, 0);

    for (let index = 0; index < foldersNames.length; index++) {

      let temp : Folder = folder.subElements.find(f => f.name === Utils.mergeFolderNames(foldersNames, 0, index)) as Folder;


      if(temp === undefined) {

        folder.subElements.push(new Folder(Utils.mergeFolderNames(foldersNames, 0, index), [], false, new Time(0, 0, 0), new Time(0, 0, 0), new Date()));
        folder = folder.subElements[folder.subElements.length -1] as Folder;
      } else {

        folder = temp;
      }

      
    }

  }

  return folder;
}

function findFile(workspaceName: string, folderName: string, fileName: string) : File | undefined{

  if(folderName === '.') {
    return workspaces.find(work => work.name === workspaceName)?.subElements.find(f => f.name === fileName);
  }
  
  let folder: Folder | undefined = findFolder(workspaceName, folderName);

  return folder?.subElements.find(f => f.name === fileName) as File;
      
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

    let folders: Folder[] = findFolders(workspaceName ?? '', getFolderName(file.name));

    let workspace: Folder | undefined = findWorkspace(workspaceName ?? '');


    


    if(folders !== []) {
      folders.forEach(f => updateTime(f.totalTime, file.time));
    }

    if(workspace !== undefined) {
      updateTime(workspace.totalTime, file.time);
    }
  }

}

function findFolders(workspaceName: string, folderName: string) : Folder[] {
  let folders : Folder[] = [];

  let folderNames: string[] = seperateFolder(folderName, 0);


  for (let index = 0; index < folderNames.length; index++) {
    let temp : Folder = findFolder(workspaceName, Utils.mergeFolderNames(folderNames, 0, index));

    if(temp !== undefined) {
      folders.push(temp);
    }
  }
  return folders;

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

