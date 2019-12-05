import React, { PureComponent } from 'react';
import { Animated, ScrollView, View } from 'react-native';

class List extends PureComponent {
    renderItems() {
		if (this.props.data && this.props.data instanceof Array && this.props.data.length) {
			const ret = [];
			for (let i = 0; i < this.props.data.length; i++) {
				const item = this.props.data[i];
				if (item && item.id) ret.push(this.props.renderItem({ item }));
			}
			return ret;
		}
    }

    renderTryButton() {
        if (this.props.data && this.props.data instanceof Array && this.props.data.length >= 1 && this.props.data.length <= 8) {
            return this.props.renderTryButton();
        }
        return null;
    }

    render() {
        return (
            <ScrollView
            onScroll={this.props.onScroll}
            scrollEventThrottle={10}
			removeClippedSubviews
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {this.props.ListHeaderComponent()}
                {this.renderItems()}
                {this.renderTryButton()}
              </View>
            </ScrollView>
        );
    }
}

export default List;
