import * as React from 'react';
import cn from 'classnames';
import './index.sass';

export default ({
  children,
  column,
  className,
  onClick,
  style,
  ...props
}: React.PropsWithChildren<any>) => (
  <div
    onClick={onClick}
    className={cn({ row: !column, col: column, [className]: className })}
    style={style || {}}
    {...props}
  >
    {children}
  </div>
);
