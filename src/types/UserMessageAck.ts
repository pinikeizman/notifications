export class MessageAck {
  message_id: string;
  channel_id: string;

  constructor(message_id: string, channel_id: string) {
    this.message_id = message_id;
    this.channel_id = channel_id;
  }
  public get messageId(): string {
    return this.message_id;
  }
  public set messageId(id: string) {
    this.message_id = id;
  }
  public get channelId(): string {
    return this.channel_id;
  }
  public set channelId(id: string) {
    this.channel_id = id;
  }
}

export class UserMessageAck {
  message_id: string;
  user_id: string;
  channel_id: string;

  constructor(message_id: string, user_id: string, channel_id: string) {
    this.message_id = message_id;
    this.user_id = user_id;
    this.channel_id = channel_id;
  }
  public get messageId(): string {
    return this.message_id;
  }
  public set messageId(id: string) {
    this.message_id = id;
  }
  public get userId(): string {
    return this.user_id;
  }
  public set userId(id: string) {
    this.user_id = id;
  }
  public get channelId(): string {
    return this.channel_id;
  }
  public set channelId(id: string) {
    this.channel_id = id;
  }
}
