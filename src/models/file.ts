
import { Element } from "./Element";
import { Time } from "./time";

export class File implements Element {
  name: string;
  time: Time;
  totalTime: Time;
  date: Date;


  constructor(name: string, time: Time, totalTime: Time, date: Date) {
    this.name = name;
    this.time = time;
    this.totalTime = totalTime;
    this.date = date;
  }
   
}
