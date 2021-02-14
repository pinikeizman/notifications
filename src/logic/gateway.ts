import * as Primus from 'primus';
import { fromEvent, Subscription } from 'rxjs';
import { filter, map, tap, bufferTime, groupBy } from 'rxjs/operators';
import { Message } from '../types/Message';
import logger from '../libs/logging';
import msgsStore, {
  getMsgById,
  publishToExchange,
} from '../modules/messages/store';
import channelStore, { updateChannelLastMsg } from '../modules/channels/store';
import model from '../modules/messages/model';
import {
  Action,
  ActionType,
  IncomingMessageWithAuthContext,
  Response,
  ResponseTypes,
  ValidatedAction,
} from '../types/Action';
import UnreachableCaseError from '../UnreachableCaseError';
import { User } from '../modules/users/types';
import { CallbackError, Model, Document } from 'mongoose';
import { MessageAck, UserMessageAck } from 'src/types/UserMessageAck';

export const handleAction = (
  user: User,
  rotateChannelSubscription: () => void
) => async (action: Action<object>): Promise<Action<object>> => {
  const type = action.type as ActionType;
  switch (type) {
    case ActionType.SendMessage:
      const msg = action.data as Message;
      await Promise.all([
        msgsStore
          .upsertMsgs([msg], user.organization)
          .then((a) => logger.getLogger().info('bulk update', a)),
        updateChannelLastMsg(msg, user.organization),
      ]);
      publishToExchange({
        ...new Response<Message>(ResponseTypes.MessagesUpdate, msg),
        organization: user.organization,
      });
      return new Action<object>(ActionType.SendMessage, []);
    case ActionType.RefreshSubscription:
      rotateChannelSubscription();
      publishToExchange({
        ...new Response<boolean>(ResponseTypes.SubscriptionRefresed, true),
        organization: user.organization,
      });
    case ActionType.AckMessage:
      const ackAction = action.data as MessageAck;
      const msgFromDb = await getMsgById(ackAction.messageId, user.organization)
      await msgsStore
        .ackMessage(msgFromDb?._id as string, ackAction.channelId, user)
        .then((res) =>
          logger.getLogger().info('message acked', ackAction, res, user)
        );
      publishToExchange({
        ...new Response<boolean>(ResponseTypes.SubscriptionRefresed, true),
        organization: user.organization,
      });
      return new Action<object>(ActionType.RefreshSubscription, []);
    case ActionType.Empty:
      return new Action<object>(type, []);
    default:
      throw new UnreachableCaseError(type);
  }
};

const validateAction = (action: Action<any>): CallbackError | undefined => {
  const MsgModel = model.getMessagesModel('');
  const UserMsgAckModel = model.getUserMessageAckModel('');
  switch (action.type) {
    case ActionType.Empty:
      return;
    case ActionType.SendMessage:
      return new MsgModel(action.data).validateSync();
    case ActionType.AckMessage:
      if (!action.data.messageId || !action.data.channelId)
        throw new Error(
          'message_id and channel_id are required on ActionType.AckMessage'
        );
      return;
    case ActionType.RefreshSubscription:
      return;
    default:
      throw new UnreachableCaseError(action.type);
  }
};

const handleClientRequests = map((a: { type: string; data: object }) => {
  try {
    const action = Action.fromData<object>(a.type, a.data);
    const error = validateAction(action);
    if (error) throw error;
    return { action, valid: true } as ValidatedAction<object>;
  } catch (e) {
    return { error: e, valid: false } as ValidatedAction<object>;
  }
});

const subscribeToChannels = async (user: User, ws: Primus.Spark) => {
  const channels = await channelStore.getChannelsForUser(
    user,
    user.organization
  );
  logger.get().info('Subscribing user to channels', user, channels);
  const { channel$: channels$, subscription } = msgsStore.getMsgsObserver(
    new Set<string>(channels.map((c) => c.id)),
    user.organization
  );
  const batched$ = channels$.pipe(
    bufferTime(500),
    filter((x) => x.length > 0),
    map((msgs) => new Response(ResponseTypes.MessagesUpdate, msgs))
  );
  const responseChannelSubscription = batched$.subscribe((msgs) => {
    logger
      .get()
      .info('Sending msg batch to user', { user, length: msgs.data?.length });
    ws.write(msgs);
  });
  return { subscription: subscription.add(responseChannelSubscription) };
};

export const handleClient = async (ws: Primus.Spark) => {
  const { user } = (ws.request as IncomingMessageWithAuthContext).authContext;

  let subscription: Subscription;

  const rotateChannelSubscription = async () => {
    if (subscription && typeof subscription.unsubscribe === 'function')
      subscription.unsubscribe();
    subscription = (await subscribeToChannels(user, ws)).subscription;
  };
  rotateChannelSubscription();
  const actionRequests$ = fromEvent<[{ type: string; data: object }]>(
    ws,
    'data'
  )
    .pipe(map(([x]) => x))
    .pipe(handleClientRequests)
    .pipe(
      filter((validatedMsg) => {
        if (!validatedMsg.valid)
          logger.get().info('Skipping msg', validatedMsg);
        return validatedMsg.valid;
      })
    )
    .pipe(map((validatedMsg) => validatedMsg.action))
    .pipe(tap(handleAction(user, rotateChannelSubscription)))
    .subscribe();

  ws.on('end', () => {
    logger.get().info(`Unsubscribing user.`, user);
    actionRequests$.unsubscribe();
  });
};
