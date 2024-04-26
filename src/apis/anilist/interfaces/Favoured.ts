import {Tag} from "./Tag";
import {Staff} from "./Staff";
import {Studio} from "./Studio";

export interface Favoured {
  genre?: string;
  amount: number;
  meanScore: number;
  timeWatched: number;
  tag?: Tag;
  staff?: Staff;
  studio?: Studio;
  year?: number;
  format?: string;
}