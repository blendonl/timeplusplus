import { Time } from "./time";
import { Element } from "./element";

export class Folder implements Element {
  
  name: string;
  time: Time;
  totalTime: Time;
  date: Date;
  
  constructor(
    name: string,
    public subElements: Element[] = [],
    public isMainFolder: boolean,
    time: Time,
    totalTime: Time,
    date: Date,
  ) {

    this.name = name;
    this.time = time;
    this.totalTime = totalTime;
    this.date = date;

  }


 
  
}
