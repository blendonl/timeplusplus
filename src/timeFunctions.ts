import { File } from "./file";
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
