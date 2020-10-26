import { TimeFunctions } from "./timeFunctions";
import { Workspace } from "./workspace";
import { Folder } from "./folder";
import { File } from "./file";
import { Time } from "./time";
import * as vscode from "vscode";
import {
  access,
  constants,
  existsSync,
  open,
  readFile,
  readFileSync,
  write,
  writeFile,
} from "fs";
import { basename } from "path";
import { TimeInABottle } from "./timeinabottle";
import { isDate } from "util";

export function updateFile(
  fileName: string,
  folderName:string,
  workspaceName:string,
  workspaces: Workspace[],
  time: Time
) {
  let fl = findFile(
    fileName,
    folderName,
    workspaceName,
    workspaces
  );
  if (fl.file !== -1) {
    let tm = workspaces[fl.workspace].folders[fl.folder].files[fl.file];
    let date: Date = new Date(
      workspaces[fl.workspace].folders[fl.folder].files[fl.file].date
    );
    let nowDate: Date = new Date();
    if (
      date.getHours() >= nowDate.getHours() &&
      date.getMinutes() <= date.getMinutes()
    ) {
      tm.time.hours = time.hours;
      tm.time.minutes = time.minutes;
      tm.time.seconds = time.seconds;
      tm.totalTime.hours += time.hours;
      tm.totalTime.minutes += time.minutes;
      tm.totalTime.seconds += time.seconds;
    } else {
      tm.totalTime.hours += time.hours;
      tm.totalTime.minutes += time.minutes;
      tm.totalTime.seconds += time.seconds;
      tm.time.hours = 0;
      tm.time.minutes = 0;
      tm.time.seconds = 0;
      tm.date = nowDate;
    }
    updateFolder(folderName, workspaceName, workspaces, time);
    updateWorkspace(workspaceName, workspaces, time);

    workspaces[fl.workspace].folders[fl.folder].files[fl.file] = tm;
  }
  writeFile("./workspaces.json", JSON.stringify(workspaces), (err) => {
    if (err) console.log(err);
  });
}
export function updateWorkspace(
  workspaceName: string,
  workspaces: Workspace[],
  time: Time
) {
  let fl = findWorkspace(workspaceName, workspaces);
  if (fl.workspace !== -1) {
    let tm = workspaces[fl.workspace];
    let date: Date = new Date(workspaces[fl.workspace].date);
    let nowDate: Date = new Date();
    if (
      date.getHours() <= nowDate.getHours() &&
      date.getMinutes() >= date.getMinutes()
    ) {
      tm.time.hours += time.hours;
      tm.time.minutes += time.minutes;
      tm.time.seconds += time.seconds;
      tm.totalTime.hours += time.hours;
      tm.totalTime.minutes += time.minutes;
      tm.totalTime.seconds += time.seconds;
    } else {
      tm.totalTime.hours += time.hours;
      tm.totalTime.minutes += time.minutes;
      tm.totalTime.seconds += time.seconds;
      tm.time.hours = 0;
      tm.time.minutes = 0;
      tm.time.seconds = 0;
      tm.date = date;
    }

    workspaces[fl.workspace] = tm;
  }

  writeFile("./workspaces.json", JSON.stringify(workspaces), (err) => {
    if (err) console.log(err);
  });
}

export function updateFolder(
  folderName: string,
  workspaceName: string,
  workspaces: Workspace[],
  time: Time
) {
  let fl = findFolder(folderName, workspaceName, workspaces);
  if (fl.folder !== -1) {
    let tm = workspaces[fl.workspace].folders[fl.folder];
    let date: Date = new Date(workspaces[fl.workspace].folders[fl.folder].date);
    let nowDate: Date = new Date();
    if (
      date.getHours() >= nowDate.getHours() &&
      date.getMinutes() <= date.getMinutes()
    ) {
      tm.time.hours += time.hours;
      tm.time.minutes += time.minutes;
      tm.time.seconds += time.seconds;
      tm.totalTime.hours += time.hours;
      tm.totalTime.minutes += time.minutes;
      tm.totalTime.seconds += time.seconds;
    } else {
      tm.totalTime.hours += time.hours;
      tm.totalTime.minutes += time.minutes;
      tm.totalTime.seconds += time.seconds;
      tm.time.hours = 0;
      tm.time.minutes = 0;
      tm.time.seconds = 0;
      tm.date = nowDate;
    }
    workspaces[fl.workspace].folders[fl.folder]= tm;
  }
  writeFile("./workspaces.json", JSON.stringify(workspaces), (err) => {
    if (err) console.log(err);
  });
}

var workspaces: JSON;

export function saveJSON(files: JSON) {
  let fi = JSON.stringify(files);

  writeFile("./files.json", fi, (err) => {});
}

export function addFile(
  fileName: string,
  folderName: string,
  workspaceName: string,
  workspaces: Workspace[]
) {
  let fl = findFile(fileName, folderName, workspaceName, workspaces);
  if(fl.file === -1) {
    if (fl.workspace === -1)
      addWorkspace(workspaceName, workspaces);
    if(folderName !== "") {
      if(fl.folder === -1) 
        addFolder(folderName, workspaceName, workspaces)
      addFileInList(fileName, workspaces[fl.workspace].folders[fl.workspace].files)
    } else {
      addFileInList(fileName, workspaces[fl.workspace].files)
    }
  }
  writeFile("./workspaces.json", JSON.stringify(workspaces), (err) => {
    if (err) console.log(err);
  });
  let index = findFile(fileName, folderName, workspaceName, workspaces);
  

  return workspaces[fl.workspace].folders[fl.folder].files[
    findFile(fileName, folderName, workspaceName, workspaces).file
  ];
}

export function addFileInList(fileName: string, files: File[]) {
      files.push({
        fileName: fileName,
        time: {
          hours: 0,
          minutes: 0,
          seconds: 0,
        },
        totalTime: {
          hours: 0,
          minutes: 0,
          seconds: 0,
        },
        date: new Date(),
      });
}




export function addWorkspace(workspaceName: string, workspaces: Workspace[]) {
  if (findWorkspace(workspaceName, workspaces).workspace === -1) {
    workspaces.push({
      workspaceName: workspaceName,
      folders: [],
      files: [],
      time: {
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
      totalTime: {
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
      date: new Date(),
    });
  }
  writeFile("./workspaces.json", JSON.stringify(workspaces), (err) => {
    if (err) console.log(err);
  });
  return workspaces[workspaces.length - 1];
}

export function addFolder(
  folderName: string,
  workspaceName: string,
  workspaces: Workspace[]
) {
  let fld = findFolder(folderName, workspaceName, workspaces);
  if (fld.folder === -1) {
    if (fld.workspace !== -1) {
      workspaces[fld.workspace].folders.push({
        folderName: folderName,
        folders: [],
        files: [],
        time: {
          hours: 0,
          minutes: 0,
          seconds: 0,
        },
        totalTime: {
          hours: 0,
          minutes: 0,
          seconds: 0,
        },
        date: new Date(),
      });
    } else {
      addWorkspace(workspaceName, workspaces);
    }
  }
  writeFile("./workspaces.json", JSON.stringify(workspaces), (err) => {
    if (err) console.log(err);
  });
  return workspaces[fld.workspace].folders[
    workspaces[fld.workspace].folders.length - 1
  ];
}

export function findFile(
  fileName: string,
  folderName: string,
  workspaceName: string,
  workspaces: Workspace[]
) {
  let i = findWorkspace(workspaceName, workspaces).workspace;
  let j = -1;
  if (i !== -1 && folderName !== "") {
    j = findFolder(folderName, workspaceName, workspaces).folder;
    if (j !== -1)
      return { workspace: i, folder: j, file: checkIfFileExist(fileName, workspaces[i].folders[j].files) };
  } else 
      return { workspace: i, folder: -1, file: checkIfFileExist(fileName, workspaces[i].files) };
  return {
    workspace: -1,
    folder: -1,
    file: -1
  }
}

export function checkIfFileExist(fileName: string, files: File[]) {
      for (let k = 0; k < files.length; k++) {
        if (
          basename(fileName).localeCompare(
            basename(files[k].fileName)
          ) === 0
        ) {
          return k;
        }
      }
      return -1;
}

export function findFolder(
  folderName: string,
  workspaceName: string,
  workspaces: Workspace[]
) {
  let i: number = findWorkspace(workspaceName, workspaces).workspace;
  if (i !== -1) {
    for (let j = 0; j < workspaces[i]["folders"].length; j++) {
      if (folderName.localeCompare(workspaces[i].folders[j].folderName) === 0) {
        return {
          workspace: i,
          folder: j,
        };
      }
    }
  }
  return {
    workspace: i,
    folder: -1,
  };
}

export function newWorkspaces(workspaceName: string, folderName: string) {
  let files: File[] = [];
  let folders: Folder[] = [
    {
      folderName: folderName,
      folders: [],
      files: files,
      time: {
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
      totalTime: {
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
      date: new Date(),
    },
  ];
  let workspaces: Workspace[] = [
    {
      workspaceName: workspaceName,
      folders: folders,
      files: [],
      time: {
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
      totalTime: {
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
      date: new Date(),
    },
  ];
  return workspaces;
}

export function findWorkspace(workspaceName: string, workspaces: Workspace[]) {
  for (let index = 0; index < workspaces.length; index++) {
    if (workspaceName.localeCompare(workspaces[index].workspaceName) === 0) {
      return {
        workspace: index,
      };
    }
  }
  return {
    workspace: -1,
  };
}

let file: File;
let folder: Folder;
let workspace: Workspace;
let timeFunctions: TimeFunctions;
export function activate(context: vscode.ExtensionContext) {
  let item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  let interval: NodeJS.Timeout;
  let workspaces: Workspace[] = newWorkspaces(
    vscode.workspace.name !== undefined ? vscode.workspace.name : "",
    ""
  );
  const isNotEmpty = new Promise((resolve, reject) => {
    access("./workspaces.json", constants.F_OK, (err) => {
      err ? reject(false) : resolve(true);
    });
  });

  if (existsSync("./workspaces.json") && isNotEmpty) {
    workspaces = JSON.parse(
      readFileSync("./workspaces.json", { encoding: "utf-8" })
    );
  } else {
    writeFile("./workspaces.json", JSON.stringify(workspaces), function (err) {
      if (err) console.log(err);
    });
  }
  if (vscode.window.activeTextEditor !== undefined) {
    addFile(
      vscode.window.activeTextEditor.document.fileName === undefined
        ? ""
        : vscode.window.activeTextEditor.document.fileName,
      "",
      vscode.workspace.name === undefined ? "" : vscode.workspace.name,
      workspaces
    );
    timeFunctions = new TimeFunctions(file);
    timeFunctions.start();
    interval = setInterval(() => {
      item.text = timeFunctions.getTime();
      item.show();
    }, 1000);
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
      e.fileName,
      vscode.workspace.workspaceFile?.path !== undefined
        ? vscode.workspace.workspaceFile.path
        : "",
      vscode.workspace.name !== undefined ? vscode.workspace.name : "",
      workspaces
    );
    timeFunctions.stop();
    timeFunctions.file = file;
    timeFunctions.start();
    interval = setInterval(() => {
      item.text = timeFunctions.getTime();
      item.show();
    }, 1000);
  });
  

  vscode.workspace.onDidCloseTextDocument(function (e: vscode.TextDocument) {
    item.text = "";
    item.show();
    clearInterval(interval);
    timeFunctions.stop();
    updateFile(file.fileName, "", vscode.workspace.name === undefined ? "" : vscode.workspace.name, workspaces, file.time);
  });


  vscode.window.registerTreeDataProvider("timeinabottle", new TimeInABottle(vscode.workspace.rootPath === undefined ? "" : vscode.workspace.rootPath))
  vscode.window.createTreeView("timeinabottle", {
    treeDataProvider: new TimeInABottle(vscode.workspace.rootPath === undefined ? "" : vscode.workspace.rootPath)
  })
}
// this method is called when your extension is deactivated
export function deactivate() {}
