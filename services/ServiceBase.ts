import * as moment from 'moment';
import Config from "../config/Config";
import { LogService } from "./LogService";

export abstract class ServiceBase
{
    protected _config: Config;
    protected _log: LogService;

    constructor()
    {
        this._config = new Config();
        this._log = new LogService();
    }

    protected getDuration(durationString: string): moment.Duration
    {
        const split = durationString.split(' ');
        if (split.length != 2)
            return moment.duration(1, 'week');

        const length = Number(split[0]);
        const normUnit = moment.normalizeUnits(<moment.unitOfTime.DurationConstructor>split[1]);
        const unit = <moment.unitOfTime.DurationConstructor>normUnit;

        if (isNaN(length) || !normUnit)
            return moment.duration(1, 'week');

        const duration = moment.duration(length, unit);
        if (duration.isValid())
            return duration;
        else
            return moment.duration(1, 'week');
    }
}