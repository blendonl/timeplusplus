import { appendFile } from "fs";
import { Time } from "./models/time";

export class Utils {
    public static mergeFolderNames(folderNames: string[], startIndex : number, endIndex: number) : string {

        let names: string = folderNames[startIndex];
      
        for (let index = startIndex + 1; index < folderNames.length && index <= endIndex; index++) {
          names +=  '/' + folderNames[index];
          
        }
      
          return names;
      
      
    }


    public static addTime(totalTime: Time, time: Time) {
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


    public static formatToMinutes(minutes: number) {
        return (minutes > 9) ? minutes : '0' + minutes;
    }

    public static removeAnyOtherChar(name: string) {
      name = name.replace('.', '');
      name = name.replace('.', '');
      name = name.replace(',', '');
      name = name.replace('#', '');
      name = name.replace('$', '');
      name = name.replace('/', '');
      name = name.replace('[', ''); 
      name = name.replace(']', '');       
      
      return name;

    }

    public static addLog(type: string, value: string) {
      appendFile('./timepluspluslogs.logs', 'Type: ' + type + ' Value: ' + value, (err) => {

      });
    }

    
}