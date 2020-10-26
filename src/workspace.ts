import { File } from './file';
import { Folder } from "./folder";
import { Time } from "./time";
export interface Workspace {
  workspaceName: string;
  folders: Folder[];
  files: File[];
  time: Time;
  totalTime: Time;
  date: Date;
}
