import React, { Component } from 'react';
import { Platform, Image } from 'react-native';

class ImageCache extends Component {
	render() {
		return <Image {...this.props} />;
	}
}

export default ImageCache;
