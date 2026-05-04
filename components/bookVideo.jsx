'use client';

import React, { useState, useEffect, useRef } from 'react';
import { trackCustomEvent } from "@/lib/fbEvents";

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const playTrackedRef = useRef(false);
  const watch50TrackedRef = useRef(false);
  const progressIntervalRef = useRef(null);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('player', {
        videoId: 'f__152v8rfE',
        playerVars: {
          autoplay: 0,
          controls: 0, // Disable native controls
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1, // Disable keyboard controls
        },
        events: {
          onStateChange: onPlayerStateChange,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    }

    return () => {
      // Cleanup player on unmount
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        try {
            playerRef.current.destroy();
        } catch (e) {
            console.warn("Player cleanup error", e);
        }
      }
    };
  }, []);

  const onPlayerStateChange = (event) => {
    if (!window.YT) return;
    
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      
      // Fire Video_Play
      if (!playTrackedRef.current) {
         playTrackedRef.current = true;
         trackCustomEvent('Video_Play', 0, 'BDT', {
             content_name: 'Book Overview Video',
             content_type: 'video',
             video_id: 'f__152v8rfE'
         });
      }

      // Track Video_Watch_50 interval
      if (!watch50TrackedRef.current && playerRef.current.getDuration) {
         progressIntervalRef.current = setInterval(() => {
            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();
            
            if (duration > 0 && (currentTime / duration) >= 0.5 && !watch50TrackedRef.current) {
                watch50TrackedRef.current = true;
                clearInterval(progressIntervalRef.current);
                
                trackCustomEvent('Video_Watch_50', 0, 'BDT', {
                   content_name: 'Book Overview Video',
                   content_type: 'video',
                   video_id: 'f__152v8rfE'
                });
            }
         }, 1000);
      }

    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
      }
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    // Check if player is ready
    if (typeof playerRef.current.getPlayerState !== 'function') return;

    const playerState = playerRef.current.getPlayerState();
    
    if (playerState === window.YT.PlayerState.PLAYING) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      <div className="flex flex-col items-center pt-16 bg-white font-['Inter',sans-serif]">
        
        <h1 className="text-4xl mb-6 text-center font-bold text-gray-800 px-">
          বইটি কি বিষয়ে এক নজরে ভিডিওতে দেখে নিন!
        </h1>

        {/* Main Video Container */}
        <div className="relative w-full max-w-[900px] px- mb-8">
          <div className="relative w-full rounded-[20px] overflow-hidden shadow-2xl bg-black group">
            
            {/* Aspect Ratio Maintainer & Video Area */}
            <div 
              className="relative pb-[56.25%] h-0 cursor-pointer"
              onClick={togglePlayPause}
            >
              {/* YouTube Player Iframe */}
              <div id="player" className="absolute top-0 left-0 w-full h-full pointer-events-none"></div>
              
              {/* Invisible Overlay for Click Interaction */}
              <div className="absolute top-0 left-0 w-full h-full z-10 bg-transparent"></div>
              
              {/* Optional: Subtle Play Icon indication when paused */}
              <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-opacity duration-300 pointer-events-none ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
              >
                 <div className="w-0 h-0 border-t-15 border-t-transparent border-l-25 border-l-white border-b-15 border-b-transparent ml-2"></div>
              </div>
            </div>

            {/* Video Title & Meta (Restored) */}
            <div className="p-5 bg-white/5 backdrop-blur-md border-t border-white/10 text-white">
              <h2 className="text-xl font-semibold mb-2 max-[768px]:text-lg">বইটি কি বিষয়ে এক নজরে ভিডিওতে দেখে নিন!</h2>
              <div className="flex items-center gap-[15px] text-white/70 text-sm max-[768px]:text-[13px]">
                <span className="flex items-center gap-[5px]"><i className="fas fa-eye"></i> 1.2M views</span>
                <span className="flex items-center gap-[5px]"><i className="fas fa-thumbs-up"></i> 45K</span>
                <span className="flex items-center gap-[5px] cursor-pointer hover:text-white transition-colors"><i className="fas fa-share"></i> Share</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}