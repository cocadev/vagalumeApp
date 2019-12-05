import React, { Component } from 'react';
import { View, TouchableWithoutFeedback, Image, Dimensions, Animated, Text, StyleSheet } from 'react-native';
import ImageCache from './ImageCache';

let TILE_SIZE = 0;
let TILE_PER_ROW = 2;
let TESTE = true;

const StationPlaceholder = require('../../img/station_placeholder.png');

// Imagens de cache das estações
export const objCacheImg = {
    '14619606471054026608': require('VagalumeFM/src/img/stations/14619606471054026608/default.png'),
    '14623883771774082279': require('VagalumeFM/src/img/stations/14623883771774082279/default.png'),
    '1464201608479108132': require('VagalumeFM/src/img/stations/1464201608479108132/default.png'),
    '14660050141766497579': require('VagalumeFM/src/img/stations/14660050141766497579/default.png')
}

// Imagens de cache bg-low das estações
export const objCacheImgBgLow = {
    '14619606471054026608': require('VagalumeFM/src/img/stations/14619606471054026608/bg-low.png'),
    '14623883771774082279': require('VagalumeFM/src/img/stations/14623883771774082279/bg-low.png'),
    '1464201608479108132': require('VagalumeFM/src/img/stations/1464201608479108132/bg-low.png'),
    '14660050141766497579': require('VagalumeFM/src/img/stations/14660050141766497579/bg-low.png')
}


export class StationTile extends Component {

    componentWillMount() {
        this.backdropOpacity = new Animated.Value(0);
    }

    openStation(station) {
		if (this.props.onPress) {
			this.props.onPress();
			if (this.props.customPress) return;
		}

		this.props.navigation.navigate('Station', { stationData: station });
    }

    feedbackOn() {
        Animated.timing(this.backdropOpacity, {
            toValue: 0.5,
            duration: 200
        }).start();
    }

    feedbackOff() {
        Animated.timing(this.backdropOpacity, {
            toValue: 0,
            duration: 200
        }).start();
    }


    render() {
        const { width } = Dimensions.get('window');
        const { station, tilesPerRow } = this.props;

        if (tilesPerRow) {
            TILE_PER_ROW = tilesPerRow;
        } else {
            TILE_PER_ROW = width > 560 ? 4 : 2;
        }

        TILE_SIZE = (width - 2) / TILE_PER_ROW;

        if (station && station.id && station.img && station.img.default) {
            const accessibilityText = `Item na lista. Estação ${station.name}.`;
            return (
                <View style={{ height: TILE_SIZE, width: TILE_SIZE, padding: 2, borderRadius: 3 }} >
                    <Image pointerEvents="none" source={require('../../img/station_placeholder.png')} style={{ position: 'absolute', left: 2, top: 2, borderRadius: 3, height: TILE_SIZE - 4, width: TILE_SIZE - 4 }} />
                    <TouchableWithoutFeedback style={{ flex: 1 }} onPressIn={this.feedbackOn.bind(this)} onPress={this.openStation.bind(this, station)} onPressOut={this.feedbackOff.bind(this)}  accessible={true} accessibilityLabel={accessibilityText} accessibilityTraits={'button'} accessibilityComponentType={'button'}>
                        <View style={{ flex: 1 }}>
							<View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.2)', zIndex: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3, height: 1 }]} />
                            <Animated.View
                            ref="backdrop"
                            pointerEvents="none"
                            style={{ borderRadius: 3, opacity: this.backdropOpacity, position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, backgroundColor: '#CF0', zIndex: 1}}
                            />
                            <ImageCache
                            style={ objCacheImg[station.id] ? { borderRadius: 3, height: TILE_SIZE - 4, width: TILE_SIZE - 4 } : { borderRadius: 3, flex: 1 } }
                            source={{ uri: station.img.default }}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            );
        }

        return <View />
    }
}
