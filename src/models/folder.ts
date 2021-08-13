import { Time } from "./time";
import { File } from "./file";
export class Folder {
  constructor(
  public folderName: string,
  public folders: Folder[],
  public files: File[],
  public time: Time,
  public totalTime: Time,
  public date: Date,
  ) {}
}
