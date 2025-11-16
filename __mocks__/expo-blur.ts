import React from 'react';

export const BlurView = React.forwardRef((props: any, ref: any) => {
  const { children, ...otherProps } = props;
  return React.createElement('View', { ...otherProps, ref }, children);
});

BlurView.displayName = 'BlurView';

export default { BlurView };