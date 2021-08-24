export class Utils {
    public static mergeFolderNames(folderNames: string[], startIndex : number, endIndex: number) : string {

        let names: string = folderNames[startIndex];
      
        for (let index = startIndex + 1; index < folderNames.length && index <= endIndex; index++) {
          names +=  '/' + folderNames[index];
          
        }
      
          return names;
      
      
    }


}