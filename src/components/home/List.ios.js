import React, { PureComponent } from 'react';
import { Animated, ScrollView, View } from 'react-native';

class List extends PureComponent {
  renderItems() {
    if (this.props.data && this.props.data instanceof Array && this.props.data.length) {
      return this.props.data.map((item) => {
        return this.props.renderItem({ item });
      });
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
