import { File } from "./models/file";
import { FileSystemError } from "vscode";

export class TimeFunctions {
  constructor(public file: File) {}
  
  interval: NodeJS.Timeout = setInterval(() => {}, 10000);
  
  
  public start() {
    this.interval = setInterval(() => {
      this.file.time.seconds += 1;
      if (this.file.time.seconds >= 60) {
        this.file.time.minutes++;
        this.file.time.seconds = 0;
      }
      if (this.file.time.minutes >= 60) {
        this.file.time.hours++;
        this.file.time.minutes = 0;
      }
    }, 1000);
  }

  public stop() { 
    this.file.totalTime.seconds += this.file.time.seconds;
    if (this.file.totalTime.seconds >= 60) {
      this.file.totalTime.minutes++;
      this.file.totalTime.seconds = 0;
    }

    this.file.totalTime.minutes += this.file.time.minutes;
    
    if (this.file.totalTime.minutes >= 60) {
      this.file.totalTime.hours++;
    
      this.file.totalTime.minutes = 0;
    }
    
    this.file.totalTime.hours += this.file.time.hours;
    clearInterval(this.interval);
  }

  public getTime() {
    return (
      this.file.time.hours +
      ":" +
      this.file.time.minutes +
      ":" +
      this.file.time.seconds
    );
  }
}
