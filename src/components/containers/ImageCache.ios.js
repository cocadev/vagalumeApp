import React, { Component } from 'react';
import { Platform } from 'react-native';
import FastImage from 'react-native-fast-image';

class ImageCache extends Component {
	render() {
		return (
			<FastImage
			{...this.props}
			resizeMode={FastImage.resizeMode[this.props.resizeMode]}
			/>
		);
	}
}

export default ImageCache;
