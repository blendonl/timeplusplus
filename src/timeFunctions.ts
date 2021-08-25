import { File } from "./models/file";
import { FileSystemError } from "vscode";
import { Time } from "./models/time";

export class TimeFunctions {
  constructor(public file: File) {}
  
  interval: NodeJS.Timeout = setInterval(() => {}, 10000);

  isStrarted: boolean = false;
  
  
  public start() {

    this.file.time.seconds = 0;
    this.file.time.minutes = 0;
    this.file.time.hours = 0;

    this.isStrarted = true;

    this.interval = setInterval(() => {
      this.expandTime(this.file.time);
      this.expandTime(this.file.totalTime);
    }, 1000);
  }

  expandTime(time: Time) {
    time.seconds +=1;

    if (time.seconds >= 60) {
      time.minutes++;
      time.seconds = 0;
    }
    if (time.minutes >= 60) {
      time.hours++;
      time.minutes = 0;
    }

  }

  public stop() { 

    clearInterval(this.interval);

    this.isStrarted = false;
 
  }

  public getTime() {
    return (
      this.file.totalTime.hours +
      ":" +
      this.file.totalTime.minutes +
      ":" +
      this.file.totalTime.seconds
    );
  }
}
