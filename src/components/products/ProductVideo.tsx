import React, { useState } from 'react';
import { FaPlay, FaPause, FaExpand, FaCompress, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface ProductVideoProps {
  videoUrl: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
}

const ProductVideo: React.FC<ProductVideoProps> = ({
  videoUrl,
  title = "Product Video",
  description,
  thumbnailUrl,
  autoplay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Handle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Handle video loaded
  const handleVideoLoaded = () => {
    setVideoLoaded(true);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      
      {description && (
        <p className="text-gray-700 mb-4">{description}</p>
      )}
      
      <div 
        ref={containerRef}
        className="relative rounded-lg overflow-hidden bg-black"
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          className="w-full h-auto"
          onClick={togglePlay}
          onLoadedData={handleVideoLoaded}
          muted={isMuted}
          autoPlay={autoplay}
          playsInline
        />
        
        {/* Loading Overlay */}
        {!videoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Play Button Overlay (shown when paused) */}
        {!isPlaying && videoLoaded && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="bg-white bg-opacity-80 rounded-full p-4">
              <FaPlay className="text-blue-600 text-2xl" />
            </div>
          </div>
        )}
        
        {/* Video Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
          <button 
            onClick={togglePlay}
            className="text-white hover:text-blue-300 focus:outline-none"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleMute}
              className="text-white hover:text-blue-300 focus:outline-none"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-300 focus:outline-none"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Video Transcript or Additional Information */}
      <div className="mt-4">
        <details className="text-sm text-gray-600">
          <summary className="font-medium text-blue-600 cursor-pointer">View Transcript</summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-md">
            <p>
              In this video, we demonstrate the key benefits of Biogen Shield Herbal Care Soap.
              You'll see how it effectively cleanses the skin while providing whitening and
              anti-bacterial benefits. The natural herbal ingredients work together to nourish
              your skin and provide long-lasting freshness.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ProductVideo;
