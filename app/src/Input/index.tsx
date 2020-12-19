import * as React from 'react';
import cn from 'classnames';
import './index.sass';

export interface InputProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
  placeholder?: string;
  label?: string;
  type?: string;
  value?: string;
  className?: string;
  error?: boolean;
  style?: object;
  fullWitdh?: boolean;
  stretch?: boolean;
}

const ltrChars =
    'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
    '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
  rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
  rtlDirCheck = new RegExp('^[^' + ltrChars + ']*[' + rtlChars + ']');
  
export const isRTL = (s: string) => rtlDirCheck.test(s);

function Input(props: InputProps) {
  const [rtl, setRtl] = React.useState(false);
  const {
    className,
    label,
    error,
    style,
    fullWitdh,
    stretch,
    onChange,
    ...otherProps
  } = props;
  const containerClassName = cn('app-input', className, { fullWitdh });
  const inputClassName = cn('app-input__input', { error }, className, {
    'app-input__stretch': stretch,
  });
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className={containerClassName} style={style}>
      {label ? <label className="app-input__label">{label}</label> : null}
      <input
        {...otherProps}
        className={inputClassName}
        onChange={(e) => {
          const inputValue = e.target.value || '';
          if (inputValue.length === 0) setRtl(false);
          else if (inputValue.length === 1) setRtl(isRTL(inputValue));
          onChange(e);
        }}
      />
    </div>
  );
}

export default Input;
