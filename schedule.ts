import * as cron from "node-cron";

export class Schedule {
    private _schedule: cron.ScheduledTask;
    private _interval: NodeJS.Timeout;
    
    public hour: number;
    public minute: number;
    public callback: () => Promise<void>;

    public setTime(hour: number, minute: number = 0): void {
        this.hour = hour;
        this.minute = minute;
        this.stop();
        this.start();
        console.log('The schedule has been updated and restarted.');
    }
    
    public setCallback(fn: () => Promise<void>) {
        this.callback = fn;
    }

    public start(): void {
        this._schedule = cron.schedule(`${this.minute} ${this.hour} * * *`, async () => await this.callback());
        this._schedule.start();
        this._interval = setInterval(() => this.logTimespan(), 5 * 60 * 1000);
        console.log('⏰ Schedule started!');
        this.logTimespan();
    }

    public stop(): void {
        this._schedule?.stop();
        clearInterval(this._interval);
        this._interval = null;
        console.log('⏰ Schedule stopped!');
    }
    
    private logTimespan(): void {
        const now = new Date();
        let future = new Date(now.getFullYear(), now.getMonth(), now.getDate(), this.hour, this.minute);
        if (future < now)
            future = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, this.hour, this.minute);

        const differenceInTime = future.getTime() - now.getTime();
        const differenceInHours = Math.floor(differenceInTime / (1000 * 3600));
        const remainingMilliseconds = differenceInTime % (1000 * 3600);
        const differenceInMinutes = Math.floor(remainingMilliseconds / (1000 * 60));
        
        const hh = differenceInHours.toString().padStart(2, '0');
        const mm = differenceInMinutes.toString().padStart(2, '0');
        console.log(`⏰ Time remaining: ${hh} hour(s), ${mm} minute(s)`);
    }
} 