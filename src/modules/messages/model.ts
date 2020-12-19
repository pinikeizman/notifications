import { Schema, Document, model } from 'mongoose';
import { UserMessageAck } from 'src/types/UserMessageAck';
import { Message } from '../../types/Message';

interface UserMessageAckDoc extends Document<string> {
  _doc: UserMessageAck;
}

interface MessageDoc extends Document<string> {
  _doc: Message;
}

export const MessageSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    from: {
      type: {
        id: String,
        username: String,
        name: String,
      },
      required: true,
    },
    channel: { type: String, required: true, index: 1 },
    msg: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const UserMessageAckSchema: Schema = new Schema(
  {
    message_id: { type: String, required: true },
    user_id: { type: String, required: true },
    channel_id: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

UserMessageAckSchema.index({ user_id: 1, channel_id: 1 }, { unique: true });

export const getMessagesModel = (org: string) =>
  model<MessageDoc>('Message', MessageSchema, `${org}_messages`);

export const getUserMessageAckModel = (org: string) =>
  model<UserMessageAckDoc>('UserMessageAckDoc', UserMessageAckSchema, `${org}_users_messages_ack`);

  export default {
  getMessagesModel,
  getUserMessageAckModel
};
