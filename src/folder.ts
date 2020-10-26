import { Time } from "./time";
import { File } from "./file";
export interface Folder {
  folderName: string;
  folders: Folder[];
  files: File[];
  time: Time;
  totalTime: Time;
  date: Date;
}
