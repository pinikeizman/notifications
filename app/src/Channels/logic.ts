import { Dictionary, groupBy, last } from "lodash";
import { ChannelIdToState, ChannelState } from ".";
import { Channel } from "../../../src/modules/channels/types";
import { Message } from "../../../src/types/Message";

export const normalizeToObject = (
    arr: any[],
    extract: (a: any) => any
  ): Dictionary<any> =>
    arr.reduce((acc, item) => ({ ...acc, [extract(item)]: item }), {});
  
  export const dedupMsgs = (
    msgs: Message[],
    state: ChannelIdToState
  ): Message[] => msgs.filter((msg) => !state[msg.channel]?.msgs[msg.id]);
  
  export const combineState = (
    msgs: Message[],
    state: ChannelIdToState,
    options?: { first?: boolean }
  ): ChannelIdToState =>
    Object.entries(groupBy(msgs, (msg) => msg.channel))
      .map(([channelId, msgs]) => {
        const { msgs: channelMsgs, length, ...channel } = state[channelId];
        const combineMsgs = options?.first
          ? {
              ...normalizeToObject(msgs, (msg) => msg.id),
              ...channelMsgs,
            }
          : {
              ...channelMsgs,
              ...normalizeToObject(msgs, (msg) => msg.id),
            };
        const channelState: ChannelState = {
          ...channel,
          msgs: combineMsgs,
          length: length + msgs.length,
          last_msg: last(Object.values(combineMsgs))
        };
        return [channelId, channelState] as [string, ChannelState];
      })
      .reduce(
        (acc, [channelId, channel]) => ({ ...acc, [channelId]: channel }),
        state
      );
  
      export const reduceState = (
    update: ChannelIdToState,
    state: ChannelIdToState
  ): ChannelIdToState => {
    const nextState: ChannelIdToState = Object.entries(update).reduce(
      (acc, [channelId, channelState]) => {
        const msgs = {
          ...(state[channelId]?.msgs || {}),
          ...channelState.msgs,
        };
        const updatedChannelState: ChannelState = {
          ...channelState as Channel,
          msgs,
          length: Object.keys(msgs).length,
        }
        return {
          ...acc,
          [channelId]: updatedChannelState,
        };
      },
      state
    );
    return nextState;
  };
  