import { Folder } from "./folder";

export class User {
    constructor(public userid: string, public username: string, public folders: Folder[]) {}
}