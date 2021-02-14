import mongoose from 'mongoose';
import MsgsModelFac from '../messages/model';
import msgsStore, { getMsgById } from '../messages/store';
import model from './model';
import { Channel } from './types';
import { User } from '../users/types';
import { Message } from 'src/types/Message';
import logging from '../../libs/logging';

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
  const msgAck = (
    await MsgsModelFac.getUserMessageAckModel(org)
      .findOne({ channel_id: channelId, user_id: userId })
      .exec()
  )?._doc;
  let filter: any;
  if (!msgAck) filter = {};
  else
    try {
      filter = { _id: { $gt: new mongoose.mongo.ObjectID(msgAck.message_id) } };
    } catch (e) {
      const msgFromDb = await getMsgById(msgAck?.message_id as string, org);
      filter = { _id: { $gt: msgFromDb?._id } };
    }

  return MsgsModelFac.getMessagesModel(org)
    .countDocuments({ ...filter, channel: channelId })
    .exec();
};

export const getChannelsByIds = (org: string, channels: string[]) =>
  model
    .getChannelsModel(org)
    .find({ id: { $in: channels } })
    .then((docs) => docs.map((doc) => doc._doc));

export const updateChannelLastMsg = async (msg: Message, org: string) =>
  model
    .getChannelsModel(org)
    .findOneAndUpdate({ id: msg.channel }, { last_msg: msg }, { new: true })
    .lean()
    .exec();

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

export const getChannelUsers = (channelId: string, org: string) =>
  model
    .getUserToChannelSchemaModel(org)
    .find({ channel_id: channelId })
    .exec()
    .then((docs) => docs.map((doc) => doc._doc));

export const createChannel = async (
  channel: Channel,
  org: string,
  users: string[]
): Promise<Channel> => {
  const ChannelModel = model.getChannelsModel(org);
  const savedChannel = await new ChannelModel(channel)
    .save()
    .then((doc) => doc._doc);
  const entires = users.map((id) => ({
    channelId: savedChannel.id,
    userId: id,
  }));
  return addUserToChannel(entires, org).then((res) => savedChannel);
};

export const addUserToChannel = async (
  entires: { channelId: string; userId: string }[],
  org: string
) => {
  const ops = entires.map((entry) => ({
    updateOne: {
      filter: { channel_id: entry.channelId, user_id: entry.userId },
      update: { channel_id: entry.channelId, user_id: entry.userId },
      upsert: true,
    },
  }));

  return model
    .getUserToChannelSchemaModel(org)
    .bulkWrite(ops)
    .then((res) => {
      logging
        .getLogger()
        .info('User Channel bulk write finished successfully', res, ops);
      return res;
    });
};

export default {
  getChannelUsers,
  getChannelsByIds,
  getChannelsForUser,
  getChannelsCountersForUser,
  updateChannelLastMsg,
  createChannel,
  addUserToChannel,
};
