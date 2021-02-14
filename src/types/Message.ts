import * as uuid from 'uuid'
import {  Response } from './Action'

export interface From {
    id: string
    username: string
    name?: string
}
export class Message {
    id: string
    from: From
    channel: string
    msg: string
    createdAt: string
    updatedAt: string
    constructor(from: From, channel: string, msg: string){
        this.id = uuid.v4();
        this.from = from;
        this.channel = channel;
        this.msg = msg;
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }
}

export interface NotificationMessage<T> extends Response<T> {
    organization: string
}