import { Folder } from "./folder";
import { User } from "./user";

export class Project {
    constructor(public mainFolder: Folder, public users: User ){}
}