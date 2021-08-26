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
import { dirname, toNamespacedPath } from "path";
import {  TreeView } from "./timeplusplus";
import { time } from "console";
import { clearInterval } from "timers";




let workspaces: Folder[];
let interval : NodeJS.Timeout;
let file: File | undefined;
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

 
  

  // if (vscode.window.activeTextEditor !== undefined) {

  //   updateWorkspaceName();

  //   file = addFile(
  //     workspaceName ?? '',
  //     vscode.window.activeTextEditor.document.fileName ?? ''
  //   );

  //   if(file !== undefined) {
      
  //     let timeFunc = findTimeFunction(file.name);

  //     if(timeFunc === undefined) {
  //       timeFunctions.push(new TimeFunctions(file));
  //       timeFunc = timeFunctions[timeFunctions.length - 1];
  //     }

      
  //     if(!timeFunc.isStrarted) {
  //       timeFunc.start();
  //     }
  //     interval = setInterval(() => {
  //       item.text = timeFunctions[timeFunctions.length - 1].getTime();
  //       item.show();
  //     }, 1000);
  //   }
  // }


  let visibleTextEditors:vscode.TextEditor[] = vscode.window.visibleTextEditors;

  vscode.window.onDidChangeVisibleTextEditors( (e: vscode.TextEditor[]) => {

    visibleTextEditors = e;

    stopTime(visibleTextEditors);


  });

  vscode.window.onDidChangeActiveTextEditor( (e: vscode.TextEditor | undefined) => {

    
    if(e !== undefined && e.document.fileName !== undefined) {

      if(!e.document.fileName.endsWith('.git') && e.document.fileName.includes('.') && e.document.languageId !== 'jsonc') {

        updateWorkspaceName();
        file = addFile(
          workspaceName ?? '',
          e.document.fileName,
        );
    
        if(file !== undefined) {

          let timeFunc = findTimeFunction(file.name);

          if(timeFunc === undefined) {
            timeFunctions.push(new TimeFunctions(file));

            timeFunc = timeFunctions[timeFunctions.length -1];
          }
        
          clearInterval(interval);
          
          if(!timeFunc.isStrarted) {

            timeFunc.start();
          }
            interval = setInterval(() => {
            item.text = timeFunc?.getTime() ?? '0:0:0';
            item.show();
          }, 1000);
        
        }
      }
    }
  });


  // vscode.workspace.onDidOpenTextDocument(function (e: vscode.TextDocument) {

    

  //   if(!e.fileName.endsWith('.git') && e.fileName.includes('.') && e.languageId !== 'jsonc') {
  //   file = addFile(
  //     workspaceName ?? '',
  //     e.fileName,
  //   );

  //   if(file !== undefined) {
    
  //     timeFunctions.push(new TimeFunctions(file));
      
  //     timeFunctions[timeFunctions.length - 1].start();
  //     interval = setInterval(() => {
  //       item.text = timeFunctions[timeFunctions.length - 1].getTime();
  //       item.show();
  //     }, 1000);
    
  //   }
  //   }
  // });
  

 
  vscode.workspace.onDidCloseTextDocument(function (e: vscode.TextDocument) {

    if(!e.fileName.endsWith('.git') && e.fileName.includes('.')) {

      updateWorkspaceName();

      file = addFile(workspaceName, e.fileName);

    item.text = "";
    item.show();
    clearInterval(interval);

    let timeFunc = findTimeFunction(e.fileName);

    if(timeFunc !== undefined && timeFunc.isStrarted) {
      timeFunc.stop();
    }


    updateAll(file);

 
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


function  updateWorkspaceName() {
  if(vscode.workspace.workspaceFolders !== undefined) {
    workspaceName = vscode.workspace.workspaceFolders[0].uri.path;
  }    
}


function newWorkspace(name: string) : Folder {
  return new Folder(workspaceName, [], true, new Time(0, 0, 0), new Time(0, 0, 0), new Date());

  
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

    if(vscode.workspace.workspaceFolders !== undefined) {
      workspaceName = vscode.workspace.workspaceFolders[0].uri.path;
    }

    let folders: Folder[] = findFolders(workspaceName ?? '', getFolderName(file.name));

    let workspace: Folder | undefined = findWorkspace(workspaceName ?? '');


    
    


    if(folders !== []) {
      
      for (let index = folders.length - 1; index >= 0; index--) {
        
        folders[index].totalTime = getTime(folders[index]);


      }
    
    }

    if(workspace !== undefined) {
      workspace.totalTime = getTime(workspace);
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
function getTime(folder: Folder) : Time {
  let time: Time = new Time(0, 0, 0);
  folder.subElements.forEach(s => {
    
    Utils.addTime(time, s.totalTime);
  });

  return time;
}