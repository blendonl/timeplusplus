import { File } from "./models/file";
import { Time } from "./models/time";
import { Utils } from "./utils";

export class TimeFunctions {
  constructor(public file: File) {

    this.dateStarted = file.date;
    this.lastTimeActive = 0;
  }
  
  interval: NodeJS.Timeout = setInterval(() => {}, 10000);

  isStrarted: boolean = false;

  dateStarted: Date;

  lastTimeActive: number;
  
  
  public start() {
    this.isStrarted = true;
    this.dateStarted = new Date();
  //  this.lastTimeActive = this.dateStarted.getTime();
  }


  public stop() { 
    this.isStrarted = false;

  }

  public getTime() {
    return (
      this.file.totalTime.hours > 0 ? 
      (
        this.file.totalTime.hours +" hr " +
        Utils.formatToMinutes(this.file.totalTime.minutes) +" min " 
      ) 
      : 
      (this.file.totalTime.minutes > 0) 
      ? Utils.formatToMinutes(this.file.totalTime.minutes) + " min" 
      : Utils.formatToMinutes(this.file.totalTime.seconds) + " sec"
      
    );
  }

  public updateTime() {

    if(!this.isStrarted) {
      return;
    }
//    let fileTime = new Date(this.dateStarted).getTime();
//    this.dateStarted.setTime(Date.now());
//    let nowTime = Date.now();
    
//    let time = nowTime - fileTime;
    
//    this.setTime(this.file.time, time);
//    this.setTime(this.file.totalTime, time);

      let minutes = this.file.time.minutes;


      this.timePlusOne(this.file.time);

      if(this.file.time.minutes > minutes) {
        this.lastTimeActive++;
      }
      this.timePlusOne(this.file.totalTime);
  }

  public timePlusOne(time: Time) {
    time.seconds += 1;

    if(time.seconds >= 60) {
      time.minutes++;
      time.seconds = time.seconds > 60 ? time.seconds / 60 : 0;

      if(time.minutes === 60) {
        time.hours++;
      }
    }
  }

  public setTime(time: Time, miliseconds: number) {

    time.seconds += this.toNaturalNumber(miliseconds / 1000);
    
    time.minutes += this.toNaturalNumber(time.seconds / 60);
    time.seconds = time.seconds % 60;

    time.hours += this.toNaturalNumber(time.minutes / 60);
    time.minutes = time.minutes % 60;

  }

  public getTimeElapsed(endTime: number) : number{
    return endTime - this.lastTimeActive;
  }

  public toNaturalNumber(n : number) {
    return parseInt(n + '');
  }

}
