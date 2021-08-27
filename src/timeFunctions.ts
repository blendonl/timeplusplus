import { File } from "./models/file";
import { FileSystemError } from "vscode";
import { Time } from "./models/time";
import { deactivate } from "./extension";

export class TimeFunctions {
  constructor(public file: File) {

    this.dateStarted = file.date;
  }
  
  interval: NodeJS.Timeout = setInterval(() => {}, 10000);

  isStrarted: boolean = false;

  dateStarted: Date;
  
  
  public start() {
  
    this.isStrarted = true;
    this.dateStarted = new Date();
  }

  expandTime(time: Time) {
    // time.seconds +=1;

    // if (time.seconds >= 60) {
    //   time.minutes++;
    //   time.seconds = 0;
    // }
    // if (time.minutes >= 60) {
    //   time.hours++;
    //   time.minutes = 0;
    // }


    this.isStrarted = true;

  }

  public stop() { 

    // clearInterval(this.interval);

    this.isStrarted = false;
 
  }

  public getTime() {
    return (

      this.file.totalTime.hours > 0 ? (
      this.file.totalTime.hours +
      " hr " +
      this.file.totalTime.minutes +
      " min " 
      ) :
      this.file.totalTime.minutes + " min"
      
    );
  }

  public updateTime() {

    if(!this.isStrarted) {
      return;
    }

    let fileTime = new Date(this.dateStarted).getTime();
    this.dateStarted.setTime(Date.now());
    let nowTime = Date.now();
    
    let time = nowTime - fileTime;
    
    this.setTime(this.file.time, time);
    this.setTime(this.file.totalTime, time);
    
    
    
    

  }

  public setTime(time: Time, miliseconds: number) {

    time.seconds += this.toNaturalNumber(miliseconds / 1000);
    
    time.minutes += this.toNaturalNumber(time.seconds / 60);
    time.seconds = time.seconds % 60;

    time.hours += this.toNaturalNumber(time.minutes / 60);
    time.minutes = time.minutes % 60;

  }

  public toNaturalNumber(n : number) {
    return parseInt(n + '');
  }

}
