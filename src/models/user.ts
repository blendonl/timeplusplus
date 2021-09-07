import { Folder } from "./folder";

export class User {
    constructor(public userId: number, public username: string, public folders: Folder[]) {}
}