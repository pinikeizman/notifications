import MsgsModelFac from '../messages/model';
import msgsStore from '../messages/store';
import model from './model';
import { Channel } from './types';
import { User } from '../users/types';

const getMsgPredicate = async (org: string, id?: string) => {
  if (!id) return {};
  const msg = await msgsStore.getMsgById(id, org);
  return { _id: { $gt: msg?._id } };
};

export const getChannelNewMsgsCounter = async (
  channelId: string,
  userId: string,
  org: string
) => {
  const msgAck = await MsgsModelFac.getUserMessageAckModel(org)
    .findOne({ channel_id: channelId, user_id: userId })
    .exec();
  const filter = msgAck ? await getMsgPredicate(org, msgAck._doc.message_id) : {};
  return MsgsModelFac.getMessagesModel(org)
    .count({ ...filter, channel: channelId })
    .exec();
};

export const getChannelsByIds = (org: string, channels: string[]) =>
  model
    .getChannelsModel(org)
    .find({ id: { $in: channels } })
    .then((docs) => docs.map((doc) => doc._doc));

export const getChannelsForUser = (
  user: User,
  org: string
): Promise<Channel[]> =>
  model
    .getUserToChannelSchemaModel(org)
    .find({ user_id: user.id })
    .exec()
    .then((res) => res.map((rel) => rel._doc.channel_id))
    .then((ids) => getChannelsByIds(org, ids));

export const getChannelsCountersForUser = (channels: Channel[], user: User) =>
  Promise.all(
    channels.map(async (channel) => {
      const counter = await getChannelNewMsgsCounter(
        channel.id,
        user.id,
        user.organization
      );
      return { [channel.id]: counter };
    })
  ).then((res) => res.reduce((acc, item) => ({ ...acc, ...item }), {}));

export default {
  getChannelsByIds,
  getChannelsForUser,
  getChannelsCountersForUser,
  async createChannel(
    channel: Channel,
    org: string,
    users: string[]
  ): Promise<Channel> {
    const ChannelModel = model.getChannelsModel(org);
    const savedChannel = await new ChannelModel(channel)
      .save()
      .then((doc) => doc._doc);
    const ops = users.map((id) => ({
      updateOne: {
        filter: { channel_id: savedChannel.id, user_id: id },
        update: { channel_id: savedChannel.id, user_id: id },
        upsert: true,
      },
    }));
    return model
      .getUserToChannelSchemaModel(org)
      .bulkWrite(ops)
      .then(() => channel);
  },
};
