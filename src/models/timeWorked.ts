import { Time } from "./time";
import { User } from "./user";

export class TimeWorked {
    constructor(public time: Time, public totalTime: Time, public user: User) {}
}