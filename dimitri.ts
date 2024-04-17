import {Discord} from "./discord";
import {Schedule} from "./schedule";

export class Program {
    public static instance: Program;
    public discord: Discord;
    public schedule: Schedule;
    
    public constructor() {
        Program.instance = this;
        this.discord = new Discord();
        this.schedule = new Schedule();
    }
    
    public async main(): Promise<void> {
        this.schedule.setCallback(async () => {
            await this.discord.kickUsersFromVoice();
        });
        
        this.schedule.setTime(1);
        console.log("Schedule has been successfully registered.")

        console.log("Starting the discord client.")
        await this.discord.start();
    }
}

new Program()
    .main()
    .then();