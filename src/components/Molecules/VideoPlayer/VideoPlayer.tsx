import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Spin, message } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, FullscreenOutlined } from '@ant-design/icons';
import './VideoPlayer.css';

export interface VideoPlayerProps {
    src: string;
    poster?: string;
    autoPlay?: boolean;
    controls?: boolean;
    loop?: boolean;
    muted?: boolean;
    playbackRates?: number[];
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onEnded?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    poster,
    autoPlay = false,
    controls = true,
    loop = false,
    muted = false,
    playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
    onTimeUpdate,
    onEnded,
    onPlay,
    onPause,
    className = '',
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            setLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            onTimeUpdate?.(video.currentTime, video.duration);
        };

        const handleEnded = () => {
            setPlaying(false);
            onEnded?.();
        };

        const handlePlay = () => {
            setPlaying(true);
            onPlay?.();
        };

        const handlePause = () => {
            setPlaying(false);
            onPause?.();
        };

        const handleWaiting = () => setLoading(true);
        const handleCanPlay = () => setLoading(false);

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
        };
    }, [onTimeUpdate, onEnded, onPlay, onPause]);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        if (playing) {
            video.pause();
        } else {
            video.play().catch(() => {
                message.error('视频播放失败');
            });
        }
    }, [playing]);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const time = parseFloat(e.target.value);
        video.currentTime = time;
        setCurrentTime(time);
    }, []);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const vol = parseFloat(e.target.value);
        video.volume = vol;
        setVolume(vol);
    }, []);

    const handlePlaybackRateChange = useCallback((rate: number) => {
        const video = videoRef.current;
        if (!video) return;

        video.playbackRate = rate;
        setPlaybackRate(rate);
    }, []);

    const toggleFullscreen = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = window.setTimeout(() => {
            if (playing) {
                setShowControls(false);
            }
        }, 3000);
    }, [playing]);

    return (
        <div
            ref={containerRef}
            className={`video-player ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => playing && setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay={autoPlay}
                loop={loop}
                muted={muted}
                playsInline
                className="video-element"
                onClick={togglePlay}
            />

            {loading && (
                <div className="video-loading">
                    <Spin size="large" />
                </div>
            )}

            {controls && showControls && (
                <div className="video-controls">
                    <div className="progress-bar">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="progress-slider"
                        />
                    </div>

                    <div className="controls-bottom">
                        <div className="controls-left">
                            <button onClick={togglePlay} className="control-btn">
                                {playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                            </button>
                            <span className="time-display">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="controls-right">
                            <div className="volume-control">
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className="volume-slider"
                                />
                            </div>

                            <div className="playback-rate">
                                <select
                                    value={playbackRate}
                                    onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                                    className="rate-select"
                                >
                                    {playbackRates.map((rate) => (
                                        <option key={rate} value={rate}>
                                            {rate}x
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={toggleFullscreen} className="control-btn">
                                <FullscreenOutlined />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
