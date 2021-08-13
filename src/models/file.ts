import { Time } from "./time";

export class File {
  constructor(
  public fileName: string,
  public time: Time,
  public totalTime: Time,
  public date: Date,
  ) {

  }
}
