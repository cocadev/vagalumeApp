
#import "MediaControlsManager.h"
#import "React/RCTEventDispatcher.h"
#import "React/RCTConvert.h"

@implementation MediaControlsManager;
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(init:(NSString *) data)
{
  // Remove Target
  [[MPRemoteCommandCenter sharedCommandCenter].playCommand removeTarget:self action:@selector(playCommand)];
  [[MPRemoteCommandCenter sharedCommandCenter].pauseCommand removeTarget:self action:@selector(pauseCommand)];
  [[MPRemoteCommandCenter sharedCommandCenter].nextTrackCommand removeTarget:self action:@selector(nextTrackCommand)];
  [[MPRemoteCommandCenter sharedCommandCenter].previousTrackCommand removeTarget:self action:@selector(previousTrackCommand)];
  [[MPRemoteCommandCenter sharedCommandCenter].togglePlayPauseCommand removeTarget:self action:@selector(tooglePlayPause)];
  
  // Add Target
  [[MPRemoteCommandCenter sharedCommandCenter].playCommand addTarget:self action:@selector(playCommand)];
  [[MPRemoteCommandCenter sharedCommandCenter].pauseCommand addTarget:self action:@selector(pauseCommand)];
  [[MPRemoteCommandCenter sharedCommandCenter].nextTrackCommand addTarget:self action:@selector(nextTrackCommand)];
  [[MPRemoteCommandCenter sharedCommandCenter].previousTrackCommand addTarget:self action:@selector(previousTrackCommand)];
  [[MPRemoteCommandCenter sharedCommandCenter].togglePlayPauseCommand addTarget:self action:@selector(tooglePlayPause)];
}

RCT_EXPORT_METHOD(updateMetas:(NSDictionary *)data)
{
	NSString *artist        = [RCTConvert NSString:data[@"artist"]];
	NSString *title         = [RCTConvert NSString:data[@"title"]];
	NSString *album         = [RCTConvert NSString:data[@"album"]];
	NSString *cover         = [RCTConvert NSString:data[@"cover"]];
	NSNumber *current       = [RCTConvert NSNumber:data[@"current"]];
	NSNumber *duration      = [RCTConvert NSNumber:data[@"duration"]];
	
	// async cover loading
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0), ^{
		UIImage *image = nil;
		// check whether cover path is present
		if (![cover isEqual: @""]) {
			// cover is remote file
			if ([cover hasPrefix: @"http://"] || [cover hasPrefix: @"https://"]) {
				NSURL *imageURL = [NSURL URLWithString:cover];
				NSData *imageData = [NSData dataWithContentsOfURL:imageURL];
				image = [UIImage imageWithData:imageData];
			}
			// cover is local file
			else {
				NSString *basePath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
				NSString *fullPath = [NSString stringWithFormat:@"%@%@", basePath, cover];
				BOOL fileExists = [[NSFileManager defaultManager] fileExistsAtPath:fullPath];
				if (fileExists) {
					image = [UIImage imageNamed:fullPath];
				}
			}
		}
		else {
			// default named "no-image"
			image = [UIImage imageNamed:@"no-image"];
		}
		// check whether image is loaded
		CGImageRef cgref = [image CGImage];
		CIImage *cim = [image CIImage];
		if (cim != nil || cgref != NULL) {
			dispatch_async(dispatch_get_main_queue(), ^{
				if (NSClassFromString(@"MPNowPlayingInfoCenter")) {
					MPMediaItemArtwork *artwork = [[MPMediaItemArtwork alloc] initWithImage: image];
					MPNowPlayingInfoCenter *center = [MPNowPlayingInfoCenter defaultCenter];
					center.nowPlayingInfo = [NSDictionary dictionaryWithObjectsAndKeys:
											 artist, MPMediaItemPropertyArtist,
											 title, MPMediaItemPropertyTitle,
											 album, MPMediaItemPropertyAlbumTitle,
											 artwork, MPMediaItemPropertyArtwork,
											 duration, MPMediaItemPropertyPlaybackDuration,
											 current, MPNowPlayingInfoPropertyElapsedPlaybackTime,
											 [NSNumber numberWithInt:1], MPNowPlayingInfoPropertyPlaybackRate, nil];
				}
			});
		}
	});
}

- (void)tooglePlayPause
{
  [self.bridge.eventDispatcher sendAppEventWithName:@"mediacontrols.togglePlayPause"
                                               body:@{@"status": @""}];
}

- (void)nextTrackCommand
{
	[self.bridge.eventDispatcher sendAppEventWithName:@"mediacontrols.onNextCommand"
													body:@{@"status": @""}];
}

- (void)previousTrackCommand
{
	[self.bridge.eventDispatcher sendAppEventWithName:@"mediacontrols.onPrevCommand"
													body:@{@"status": @""}];
}

- (void)playCommand
{
	 [self.bridge.eventDispatcher sendAppEventWithName:@"mediacontrols.play"
                                                body:@{@"status": @""}];
}

- (void)pauseCommand
{
  [self.bridge.eventDispatcher sendAppEventWithName:@"mediacontrols.pause"
                                               body:@{@"status": @""}];
}

@end
