#import <Foundation/Foundation.h>
#import <AudioToolbox/AudioToolbox.h>
#import <AudioToolbox/AudioServices.h>
#import <AVFoundation/AVFoundation.h>

#import <AVFoundation/AVPlayer.h>
#import <AVFoundation/AVPlayerItem.h>

#import <MediaPlayer/MediaPlayer.h>
#import <MediaPlayer/MPNowPlayingInfoCenter.h>
#import <MediaPlayer/MPMediaItem.h>

#import "React/RCTBridgeModule.h"

typedef enum {
  STARTING        = 1,
  PLAYING         = 2,
  STOPPED         = 3,
  ERROR           = 4,
  ENDED           = 6,
  READY           = 7
} STATE;

typedef enum {
  STREAM_FAIL    = 96,
  INVALID_STREAM = 95
} ERRORCODE;

@interface AVPlayerManager : NSObject <RCTBridgeModule>
{
  AVPlayer* objAVPlayer;
  int currentState;
  BOOL hasPlayed;
  BOOL isPlaying;
  NSDate* lastDate;
  int buffer;
}

@property (nonatomic, strong) AVPlayer* objAVPlayer;
@property (nonatomic) int currentState;
@property (nonatomic) BOOL hasPlayed;
@property (nonatomic) BOOL isPlaying;
@property (nonatomic) int buffer;

@end
