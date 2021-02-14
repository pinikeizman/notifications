import * as React from 'react';
import moment from 'moment';
import cn from 'classnames';

import { Message } from '../../../src/types/Message';
import Flex from '../Flex';
import { isRTL } from '../Input';
import { Ackable } from '../Channels';
import './index.sass';

export interface MsgProps {
  msg: Ackable<Message>;
  mine: boolean;
}

const MsgComp = ({ msg, mine, ...props }: MsgProps) => (
  <Flex
    column
    dir={isRTL(msg.msg.trim().charAt(0)) ? 'rtl' : 'ltr'}
    className={cn('message', { message__mine: mine })}
    key={msg.id}
    {...props}
  >
    <div className="message__header">
      <span className="message__value" title={msg.from.username}>
        {msg.from.name}
      </span>
    </div>
    <div className="message__body">
      <span className="message__value">{msg.msg}</span>
    </div>
    <div className="message__fotter">
      <span className="message__value">
        {moment(msg.createdAt).format('h:mm')}
      </span>
    </div>
  </Flex>
);

export default MsgComp;
