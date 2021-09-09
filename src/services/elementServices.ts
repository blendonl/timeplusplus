import { connect } from "http2";
import { Connect } from "../connect";
import { File } from "../models/file";
import { Folder } from "../models/folder";
import { Time } from "../models/time";
import { Utils } from "../utils";

export class ElementServices {

    static addFile(workspace: Folder, folderName: string, fileName: string) : File | undefined{
  
        let file : File | undefined = ElementServices.findFile(workspace, folderName, fileName);
      
        let folder : Folder | undefined;
        
        if(file !== undefined) {
            return file;
        }
          
        folder = ElementServices.findFolder(workspace, folderName);
            
        if(folder === undefined) {
            folder = ElementServices.addFolder(workspace, folderName);
        }

        file = new File(fileName, new Time(0, 0, 0), new Time(0, 0, 0), new Date());

        folder?.subElements.push(file);
    
        return file;
        
    }


    static addFolder(workspace: Folder, folderName: string) : Folder{

        let folder: Folder = ElementServices.findFolder(workspace, folderName);
      
        if(folder !== undefined) {
            return folder;
        }

        folder = workspace;
      
        let foldersNames : string[] = ElementServices.seperateFolder(folderName, 0);
      
        for (let index = 0; index < foldersNames.length; index++) {
    
            let temp : Folder = folder.subElements.find(f => f.name === Utils.mergeFolderNames(foldersNames, 0, index)) as Folder;
        
        
            if(temp === undefined) {
        
                folder.subElements.push(new Folder(Utils.mergeFolderNames(foldersNames, 0, index), [], false, '',new Time(0, 0, 0), new Time(0, 0, 0), new Date()));
                folder = folder.subElements[folder.subElements.length -1] as Folder;
                
            
            } else {
        
                folder = temp;
            }
        }

        return folder;
    
    }

    
    static findFile(workspace: Folder, folderName: string, fileName: string) : File | undefined{

        if(folderName === '.') {
            return workspace.subElements.find(f => f.name === fileName);
        }
        
        let folder: Folder | undefined = ElementServices.findFolder(workspace, folderName);
    
        return folder?.subElements.find(f => f.name === fileName) as File;
            
    }

    static findFolder(workspace: Folder, folderName: string) {

        if(folderName === '.') {
            return workspace;
        }

        let foldersNames: string[] = ElementServices.seperateFolder(folderName, 0);
      
        let folder : Folder | undefined = workspace.subElements.find(f => 'subElements' in f && f.name === foldersNames[0]) as Folder;
      
        for(let i = 1; i < foldersNames.length && folder !== undefined; i++) {
      
          folder = folder?.subElements.find(f => f.name === Utils.mergeFolderNames(foldersNames, 0, i )) as Folder;
      
        }
      
        return folder;
      
        
    }

    static seperateFolder(folderName: string, startIndex: number) : string[] {

        let strings : string[] = [];
        let i = 0;

        for (let index = startIndex; index < folderName.length; index++) {
            if(folderName[index] === '\\' || folderName[index] === '/') {
                strings.push(folderName.slice(i, index));
                i = index + 1;
            }
        }
      
        strings.push(folderName.slice(i, folderName.length));
      
        return strings;
    }
         
    static newWorkspace(workspaceName: string) : Folder {
        return new Folder(
            workspaceName,
            [],
            true,
            '', 
            new Time(0, 0, 0), 
            new Time(0, 0, 0), 
            new Date()
        );
      
    }

    static findFolders(workspace: Folder, folderName: string) : Folder[] {
        let folders : Folder[] = [];
      
        let folderNames: string[] = ElementServices.seperateFolder(folderName, 0);
        
        let temp = ElementServices.findFolder(workspace, Utils.mergeFolderNames(folderNames, 0, 0));
        
        if(temp === undefined) {
            return [];
        } 
        
        folders.push(temp);
        
        for (let index = 1; index < folderNames.length; index++) {
          let temp : Folder | undefined = folders[folders.length - 1].subElements.find( f => f.name === Utils.mergeFolderNames(folderNames, 0, index)) as Folder;
      
          if(temp !== undefined) {
            folders.push(temp);
          }
        }
        return folders;
      
    }

    static findWorkspace(workspaces: Folder[], workspaceName: string) : Folder | undefined {
        let names = this.seperateFolder(workspaceName, 0);
    
        return workspaces.find(w => w.isMainFolder && w.name === names[names.length - 1]);
    }

      
}