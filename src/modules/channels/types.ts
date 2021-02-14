import { Message } from '../../types/Message';
import * as uuid from 'uuid';
export interface EnrichedChannel extends Channel {
  newMsgs: number;
}

export class Channel {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  last_msg?: Message;

  constructor(name: string, id?: string, createAt?: string, lastMsg?: Message) {
    this.id = id || uuid.v4();
    this.createdAt = createAt || '';
    this.name = name;
    this.last_msg = lastMsg;
  }
}

export class UserToChannel {
  user_id: string;
  channel_id: string;

  constructor(userId: string, channelId: string) {
    this.user_id = userId;
    this.channel_id = channelId;
  }
}
