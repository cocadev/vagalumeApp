
#import "AVPlayerManager.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTConvert.h"

@implementation AVPlayerManager;
@synthesize bridge = _bridge;

@synthesize objAVPlayer;
@synthesize currentState;
@synthesize hasPlayed;
@synthesize buffer;
@synthesize isPlaying;

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(startPlayingAudioFile:(NSString *)url)
{
  
  // Se ainda não tiver player instanciado
  if([self objAVPlayer] == nil) {
    NSURL* resourceURL = [[NSURL alloc] initFileURLWithPath: url];
    
    // Cria um Item utilizando a URL que foi passada pelo JS e adiciona os Observers
    AVAsset *asset = [AVURLAsset URLAssetWithURL: resourceURL options:nil];
    AVPlayerItem *item = [AVPlayerItem playerItemWithAsset:asset];
    [item addObserver:self forKeyPath:@"error" options:NSKeyValueObservingOptionNew context:nil];
    [item addObserver:self forKeyPath:@"status" options:NSKeyValueObservingOptionNew context:nil];
    [item addObserver:self forKeyPath:@"timedMetadata" options:NSKeyValueObservingOptionNew context:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(playerItemFailedToPlayToEndTime:) name:AVPlayerItemFailedToPlayToEndTimeNotification object:item];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(playerItemPlaybackStalled:) name:AVPlayerItemPlaybackStalledNotification object:item];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(playerItemDidFinishPlaying:) name:AVPlayerItemDidPlayToEndTimeNotification object:item];
    
    // Instancia o player e adiociona os Observers
    [self setObjAVPlayer:[AVPlayer playerWithPlayerItem: item]];
    [[self objAVPlayer] addObserver:self forKeyPath:@"rate" options:0 context:nil];
    
    // Inicia informando o JS que está buffering
    [self changeStatus: STARTING];
    self.hasPlayed = NO;
    self.buffer = 0;
    // Se já tiver player
  } else {
    [[self objAVPlayer] play];
  }
}

RCT_EXPORT_METHOD(startPlayingAudio:(NSString *)url)
{
  
  // Se ainda não tiver player instanciado
  if([self objAVPlayer] == nil) {
    NSURL* resourceURL = [NSURL URLWithString: url];
    
    // Cria um Item utilizando a URL que foi passada pelo JS e adiciona os Observ
    AVPlayerItem *item = [AVPlayerItem playerItemWithURL:resourceURL];
    [item addObserver:self forKeyPath:@"error" options:NSKeyValueObservingOptionNew context:nil];
    [item addObserver:self forKeyPath:@"status" options:NSKeyValueObservingOptionNew context:nil];
    [item addObserver:self forKeyPath:@"timedMetadata" options:NSKeyValueObservingOptionNew context:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(playerItemFailedToPlayToEndTime:) name:AVPlayerItemFailedToPlayToEndTimeNotification object:item];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(playerItemPlaybackStalled:) name:AVPlayerItemPlaybackStalledNotification object:item];
    
    // Instancia o player e adiociona os Observers
    [self setObjAVPlayer:[AVPlayer playerWithPlayerItem: item]];
    [[self objAVPlayer] addObserver:self forKeyPath:@"rate" options:0 context:nil];
    
    // Caso tenha buffer para iniciar a música
    if (self.buffer) {
      CMTime time = CMTimeMake(self.buffer, 1);
      [self.objAVPlayer seekToTime:time toleranceBefore:kCMTimePositiveInfinity toleranceAfter:kCMTimeZero];
    }
    
    // Inicia informando o JS que está buffering
    [self changeStatus: STARTING];
    self.hasPlayed = NO;
    // Se já tiver player
  } else {
    [[self objAVPlayer] play];
  }
}

RCT_REMAP_METHOD(getPosition, resolve: (RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  if (self.objAVPlayer != nil) {
    float position = CMTimeGetSeconds(self.objAVPlayer.currentTime) - 450;
    NSString *ret = [NSString stringWithFormat:@"%f", (45 - ((ceil((float)position/45) * 45) - position))];
    resolve(ret);
  } else {
    reject(@"notInitiated", @"Not initiated", nil);
  }
}

RCT_EXPORT_METHOD(seekTo:(NSString *)timeStr)
{  
  CMTime time = CMTimeMake([timeStr integerValue], 1);
  [self.objAVPlayer seekToTime:time toleranceBefore:kCMTimePositiveInfinity toleranceAfter:kCMTimeZero];
}

RCT_EXPORT_METHOD(putBuffer:(int)buffer)
{
  self.buffer = buffer;
}

RCT_EXPORT_METHOD(stopPlayingAudio:(NSString *)command)
{
  [[self objAVPlayer] pause];
  [self changeStatus: STOPPED];
  self.isPlaying = NO;
}

RCT_EXPORT_METHOD(release:(NSString *)command)
{
  [[self objAVPlayer] removeObserver:self forKeyPath:@"rate"];
  [[self objAVPlayer].currentItem removeObserver:self forKeyPath:@"error"];
  [[self objAVPlayer].currentItem removeObserver:self forKeyPath:@"status"];
  [[self objAVPlayer].currentItem removeObserver:self forKeyPath:@"timedMetadata"];
  self.objAVPlayer = nil;
}

// Chama o callback no JS
- (void)emitDelay:(float)delay
{
  NSString *delayStr = [NSString stringWithFormat:@"%f", delay];
  [self.bridge.eventDispatcher sendAppEventWithName:@"avplayer.onDelay"
                                               body:@{@"delay": delayStr}];
}

// Chama o callback no JS
- (void)sendId3Metadata:(NSDictionary *)metadata
{
  [self.bridge.eventDispatcher sendAppEventWithName:@"avplayer.onId3Metadata"
                                               body:@{@"metadata": metadata}];
}

// Chama o callback no JS
- (void)changeStatus:(int)state
{
  // Verifica se o state é diferente
  if (self.currentState != state && state != 5) {
    self.currentState = state;
    NSString *stateStr = [NSString stringWithFormat:@"%d", state];
    [self.bridge.eventDispatcher sendAppEventWithName:@"avplayer.onStateChanged"
                                                 body:@{@"status": stateStr}];
  }
}

// Seta error
- (void)setError:(int)error
{
  NSLog(@"Error: %d",  error);
  self.currentState = ERROR;
  NSString *errorStr = [NSString stringWithFormat:@"%d", error];
  [self.bridge.eventDispatcher sendAppEventWithName:@"avplayer.onError"
                                               body:@{@"status": errorStr}];
}

- (void) playerItemPlaybackStalled:(NSNotification *)notification
{
  [self setError: STREAM_FAIL];
}

- (void) playerItemFailedToPlayToEndTime:(NSNotification *)notification
{
  [self setError: STREAM_FAIL];
}

- (void) playerItemDidFinishPlaying:(NSNotification *)notification
{
  [self changeStatus: ENDED];
  self.isPlaying = NO;
}

- (void) observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  
  // Obter metadata do arquivo
  if ([keyPath isEqualToString:@"timedMetadata"])
  {
    AVPlayerItem* playerItem = object;
    NSMutableDictionary* id3 = [NSMutableDictionary new];
    
    for (AVMetadataItem* metadata in playerItem.timedMetadata)
    {
      NSString* metaKey = [metadata.key description];
      NSString* metaValue = metadata.stringValue;
      metaValue = [NSString stringWithCString:[metaValue cStringUsingEncoding:NSISOLatin1StringEncoding] encoding:NSUTF8StringEncoding];
      
      if ([metaKey isEqualToString:@"TPE1"]) {
        id3[@"band"] = metaValue;
      } else if ([metaKey isEqualToString:@"TPE2"]) {
        id3[@"band_url"] = metaValue;
      } else if ([metaKey isEqualToString:@"TIT2"]) {
        id3[@"song"] = metaValue;
      } else if ([metaKey isEqualToString:@"TIT3"]) {
        id3[@"song_url"] = metaValue;
      } else if ([metaKey isEqualToString:@"TLEN"]) {
        id3[@"duration"] = metaValue;
      } else if ([metaKey isEqualToString:@"TOFN"]) {
        id3[@"segment"] = metaValue;
      } else if ([metaKey isEqualToString:@"TIME"]) {
        id3[@"time"] = metaValue;
      } else if ([metaKey isEqualToString:@"TXXX"]) {
        id3[@"extra"] = metaValue;
      }
    }
    
    [self sendId3Metadata:id3];
  }
  
  // Se a mudança foi no AVPlayer
  if (object == [self objAVPlayer]) {
    
    if ([keyPath isEqualToString:@"rate"]) {
      if ([self objAVPlayer].rate == 0) {
        if (self.hasPlayed) {
          [self changeStatus: STOPPED];
          self.isPlaying = NO;
        }
      } else if ([self objAVPlayer].rate == 1 && [self objAVPlayer].currentItem.error == nil) {
        [self emitDelay: 450];
        
        [self changeStatus: PLAYING];
        self.isPlaying = YES;
        self.hasPlayed = YES;
      }
    }
    // Se a mudança foi no AVPlayerItem
  } else if (object == [self objAVPlayer].currentItem) {
    if ([keyPath isEqualToString:@"status"]) {
      if ([self objAVPlayer].status == AVPlayerItemStatusReadyToPlay) {
        // Inicia informando o JS que está buffering
        [self changeStatus: READY];
        
        //Audio session is set to allow streaming in background
        AVAudioSession *audioSession = [AVAudioSession sharedInstance];
        [audioSession setCategory:AVAudioSessionCategoryPlayback error:nil];
        [audioSession setActive:YES error:NULL];
        [[self objAVPlayer] play];
      } else if ([self objAVPlayer].currentItem.status == AVPlayerItemStatusFailed) {
        [self setError: INVALID_STREAM];
      }
    } else if ([keyPath isEqualToString:@"error"]) {
      [self setError: INVALID_STREAM];
    }
  }
}

@end

