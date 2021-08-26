import { Time } from "./time";
import { File } from "./file";
import { Element } from "./Element";
import { Utils } from "../utils";
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
