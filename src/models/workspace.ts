import { File } from "./file";
import { Folder } from "./folder";
import { Time } from "./time";

export class Workspace {
    constructor(
        public workspaceName: string, 
        public folders : Folder[], 
        public files: File[],
        public time: Time, 
        public totalTime: Time, 
        public date: Date
    ) {}
}