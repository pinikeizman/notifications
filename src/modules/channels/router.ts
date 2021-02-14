import express from 'express';
import { Context, RequestWithCtx } from '../../libs/types';
import {
  FailedResponse,
  RouteHandler,
  routeWrapper,
  SuccessResponse,
} from '../../modules/utils';
import store from './store';
import { Channel } from './types';

type PostChannelsReq = { channel: Channel; users: string[] };
type InviteUserReq = { usersIds: string[] };

const router = express.Router();

const getUserChannels: RouteHandler = (req: RequestWithCtx) => {
  const { user }: Context = req.authContext;
  return store
    .getChannelsForUser(user, user.organization)
    .then(async (channels) => {
      const counters = await store.getChannelsCountersForUser(channels, user);
      return channels.map((channel) => ({
        ...channel,
        newMsgs: counters[channel.id],
      }));
    })
    .then((res) => new SuccessResponse(res));
};

const getChannelUsers: RouteHandler = (req: RequestWithCtx) => {
  const { user }: Context = req.authContext;
  const { id } = req.params;
  return store
    .getChannelUsers(id, user.organization)
    .then((res) => new SuccessResponse(res));
};

const postChannels: RouteHandler = (req: RequestWithCtx) => {
  const { user }: Context = req.authContext;
  const { channel, users }: PostChannelsReq = req.body;

  return store
    .createChannel(channel, user.organization, users || [])
    .then((res) => new SuccessResponse(res));
};
const inviteUsers: RouteHandler = (req: RequestWithCtx) => {
  const { user }: Context = req.authContext;
  const { usersIds }: InviteUserReq = req.body;
  const { id: channelId } = req.params;
  if (usersIds.length < 1 || usersIds.some((u) => !u))
    throw new FailedResponse([new Error('User Id must be provided')], 400);
  if(!channelId)
    throw new FailedResponse([new Error('Channel Id must be provided')], 400);
  return store
    .addUserToChannel(
      usersIds.map((userId) => ({ channelId, userId })),
      user.organization
    )
    .then((res) => new SuccessResponse(res));
};

router.get('/channels', routeWrapper(getUserChannels));
router.get('/channels/:id/users', routeWrapper(getChannelUsers));
router.post('/channels/:id/invite', routeWrapper(inviteUsers));

router.post('/channels', routeWrapper(postChannels));

export default router;
