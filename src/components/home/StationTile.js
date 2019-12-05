import React, { Component } from 'react';
import { View, Text, StyleSheet, Platform, Image, Dimensions, TouchableWithoutFeedback, Animated } from 'react-native';
import Icon from '../containers/Icon';
import ImageCache from '../containers/ImageCache';

const { width } = Dimensions.get('window');

const placeholderImage = require('../../img/station_placeholder.png');

// Imagens de cache das estações
export const objCacheImg = {
    '14623883771774082279': require('VagalumeFM/src/img/stations/14623883771774082279/default.png'),
    '14660050141766497579': require('VagalumeFM/src/img/stations/14660050141766497579/default.png'),
    '14619606471054026608': require('VagalumeFM/src/img/stations/14619606471054026608/default.png'),
    '1464201608479108132': require('VagalumeFM/src/img/stations/1464201608479108132/default.png'),
    '1470154922349875': require('VagalumeFM/src/img/stations/1470154922349875/default.png'),
    '1470155219129532': require('VagalumeFM/src/img/stations/1470155219129532/default.png'),
    '14658544132100453351': require('VagalumeFM/src/img/stations/14658544132100453351/default.png'),
    '146411300413492499': require('VagalumeFM/src/img/stations/146411300413492499/default.png')
};

class StationTile extends Component {

    componentWillMount() {
        this._backdropOpacity = new Animated.Value(0);
    }

    onPress() {
		const stationData = this.props.station;
        this.props.navigation.navigate('Station', { stationData });
    }

    feedbackOn() {
        Animated.timing(this._backdropOpacity, {
            toValue: 0.3,
            duration: 200
        }).start();
    }

    feedbackOff() {
        Animated.timing(this._backdropOpacity, {
            toValue: 0,
            duration: 200
        }).start();
    }

    renderListeners() {
        const { listeners } = this.props;

        return (
            <View style={styles.listenersContent}>
				<Icon name="listeners" size={12} color="#CF0" style={styles.listenersIcon} />
                <Text style={styles.listenersText}>{listeners || `${Math.floor(Math.random() * ((600 - 230) + 1)) + 230}`} ouvindo agora</Text>
            </View>
        );
    }

    renderTag() {
        const { station } = this.props;
        let updateDate = station.updated;
        let creationDate = station.ts;

        if (creationDate) {
            creationDate = new Date(creationDate * 1000);

            if (creationDate.setDate(creationDate.getDate() + 20) > new Date()) {
				return (
					<View style={styles.tagContainer}>
						<Text style={styles.tag}>
							NOVA
						</Text>
					</View>
				);
            }
        }

        if (updateDate) {
            updateDate = new Date(updateDate * 1000);

            if (updateDate.setDate(updateDate.getDate() + 15) > new Date()) {
				return (
					<View style={[styles.tagContainer, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
						<Text style={[styles.tag, { color: '#CF0' }]}>ATUALIZADA</Text>
					</View>
				);
            }
        }
    }

    render() {
        const { numColumns, station } = this.props;
        const tileWidth = ((width - (4 * numColumns)) / numColumns);
        const stationImage = objCacheImg[station.id] ?
        objCacheImg[station.id] :
        station && station.img && station.img.default ?
        { uri: station.img.default, cache: 'force-cache' } :
        placeholderImage;
        const accessibilityText = `Item na lista. Estação: ${station.name}. Descrição: ${station.desc_station}.`;
        // const resizeMode = Platform.OS === 'ios' ? ImageCache.resizeMode.cover : "cover";

        return (
            <TouchableWithoutFeedback
            onPressIn={this.feedbackOn.bind(this)}
            onPress={this.onPress.bind(this, station)}
            onPressOut={this.feedbackOff.bind(this)}
            accessibilityComponentType='button'
            accessible={true}
            accessibilityLabel={accessibilityText}
            accessibilityTraits={'button'}>
                <View style={[styles.body, { width: tileWidth }]}>
                    <View style={{ height: (tileWidth * 0.8), width: tileWidth, backgroundColor: '#333', borderTopLeftRadius: 3, borderTopRightRadius: 3 }}>
						<View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.2)', zIndex: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3, height: 1 }]} />
						<Image source={placeholderImage} style={{ height: (tileWidth * 0.8), width: tileWidth, backgroundColor: '#333', position: 'absolute', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                        <ImageCache
                        resizeMode="cover"
                        source={stationImage}
                        style={[styles.image, { height: (tileWidth * 0.8), width: tileWidth }]}
                        />
                        {this.renderTag()}
                    </View>
                    <View style={[styles.descContent, { width: tileWidth }]}>
                        <Image blurRadius={10} source={stationImage} style={[styles.descImage, { width: tileWidth }]} />
                        <View style={styles.descMask}>
                            {this.renderListeners()}
                            <Text
                            numberOfLines={4}
                            style={styles.desc}
                            >
                                {station.desc_station}
                            </Text>
                        </View>
                    </View>

                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const styles = StyleSheet.create({
    body: {
        backgroundColor: '#2d2d2d',
        elevation: 3,
        margin: 2,
        borderRadius: 3
    },
    image: {
        flex: 1,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        position: 'absolute'
    },
    backdrop: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        backgroundColor: '#CF0',
        zIndex: 1
    },
    descContent: {
        height: 116,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3
    },
    descImage: {
        position: 'absolute',
        height: 116,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3
    },
    desc: {
        color: 'white',
        textAlign: 'left',
        fontSize: 14,
		fontFamily: 'rubik'
    },
	tagContainer: {
		padding: 3,
		borderRadius: 3,
		backgroundColor: '#CF0',
        position: 'absolute',
        top: 5,
        right: 5,
		paddingBottom: 2,
		justifyContent: 'center',
		alignItems: 'center'
	},
    tag: {
        color: '#2d2d2d',
        fontFamily: 'rubik-bold',
        fontSize: 10
    },
    descMask: {
        flex: 1,
        backgroundColor: 'rgba(45, 45, 45, 0.7)',
        padding: 8,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3
    },
    listenersContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 6,
        marginBottom: 6,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
        borderBottomWidth: 0.5
    },
    listenersIcon: {
        marginRight: 4
    },
    listenersText: {
        fontFamily: 'rubik',
        color: '#FFF',
        fontSize: 13
    }
});

export default StationTile;
