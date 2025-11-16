import React from 'react';

export const Image = React.forwardRef((props: any, ref: any) => {
  return React.createElement('Image', { ...props, ref });
});

Image.displayName = 'Image';

export const ImageBackground = React.forwardRef((props: any, ref: any) => {
  const { children, ...otherProps } = props;
  return React.createElement('View', { ...otherProps, ref }, children);
});

ImageBackground.displayName = 'ImageBackground';

export default Image;