import React from 'react';

import Flex from '../Flex';
import cn from 'classnames';

import { User } from '../../../src/modules/users/types';
import MuiAvatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';
import './index.sass';

const useStyles = makeStyles((theme) => ({
  s: {
    height: '2rem',
    width: '2rem',
  },
  m: {
    height: '2.5rem',
    width: '2.5rem',
  },
  l: {
    height: '3rem',
    width: '3rem',
  },
  xl: {
    height: '4rem',
    width: '4rem',
  },
}));

const Avatar = ({
  size,
  className,
  src,
  alt,
  label,
  onClick,
  ...props
}: {
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  src?: string;
  alt?: string;
  label?: string;
  ref?: React.MutableRefObject<any>;
  size: 's' | 'm' | 'l' | 'xl';
}) => {
  const classes = useStyles();

  return (
    <Flex column className={cn('avatar', className, {'avatar__clickable': onClick})} onClick={onClick} {...props}>
      <MuiAvatar className={classes[size]} alt={alt} src={src} />
      {label && <h4 className="avatar__label">{label}</h4>}
    </Flex>
  );
};

export default Avatar;
