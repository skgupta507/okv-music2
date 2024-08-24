import React, { useEffect, useRef, useState } from "react";
import { BsChevronDown } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { getAudioUrls } from "../../api/getAudio";
import { useGetSongsByIdQuery } from "../../reduxtool/services/songsApi";
import { addSongInfo } from "../../reduxtool/slice/currentSongSlice";
import MiniPlayer from "./miniPlayer/MiniPlayer";
import "./Player.css";
import PlayerControls from "./playerControls/PlayerControls";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import RelatedSongs from "./relatedSongs/RelatedSongs";
import PlayerMoreInfo from "./playerMoreInfo/PlayerMoreInfo";
import SongDetailsModel from "./songDetailsModel/SongDetailsModel";
import { useLocation } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
import ReactPlayer from "react-player";
import Toggle from "../toggle/Toggle";

const Player = () => {
  const [audioUrl, setAudioUrl] = useState("");
  const [songsInfo, setSongsInfo] = useState([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [songsList, setSongsList] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({
    isMoreInfoClick: false,
    isAudioQualityClick: false,
    isSongDetailsClick: false,
  });
  const localAudioFormat = localStorage.getItem("audioQuality");
  const [audioFormat, setAudioFormat] = useState(localAudioFormat ?? "high");
  const localVolume = localStorage.getItem("localVolume");
  const [volumeLevel, setVolumeLevel] = useState(
    parseFloat(localVolume) ?? 1.0
  );

  const [activeToggle, setActiveToggle] = useState("audio");

  const toggleList = [
    { name: "Audio", value: "audio" },
    { name: "Video", value: "video" },
  ];

  const dispatch = useDispatch();
  const currentSong = useSelector(
    (state) => state.currentSongSlice.currentSongInfo
  );
  const { id, miniPlayerActive } = currentSong;

  const { data, isLoading } = useGetSongsByIdQuery(id);

  const [progress, setProgress] = useState({ played: 0, loaded: 0 });

  const audioRef = useRef();
  const reactPlayerRef = useRef();

  // get songs audio url
  const getSongAudioUrls = async () => {
    setAudioLoading(true);
    try {
      const response = await getAudioUrls({ id });
      const data = await response.json();
      if (audioFormat === "high") {
        setAudioUrl(data.audioFormatHigh);
      } else {
        setAudioUrl(data.audioFormatLow);
      }
      setIsPlaying(autoPlay);
    } catch (error) {
      // setIsReactPlayerActive(true);
      setAlertMessage("Unable to get audio link, Please switch to video mode");
    }
  };
  useEffect(() => {
    if (activeToggle === "video") return;
    getSongAudioUrls();
    // eslint-disable-next-line
  }, [id, audioFormat, activeToggle]);

  useEffect(() => {
    if (data) {
      setSongsInfo(data.items);
    }
  }, [data]);

  useEffect(() => {
    if (songsInfo[0]?.snippet?.liveBroadcastContent === "live") {
      setAlertMessage("can't play live stream");
    }
  }, [songsInfo]);

  const mapVideoId = songsList?.map((song) => song.videoId);
  const currentIndex = mapVideoId.findIndex((x) => x === id);
  const handleNext = () => {
    if (currentIndex < mapVideoId.length - 1) {
      dispatch(
        addSongInfo({ ...currentSong, id: mapVideoId[currentIndex + 1] })
      );
      setAutoPlay(true);
      setIsPlaying(true);
    } else {
      setAlertMessage("you reached at end");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      dispatch(
        addSongInfo({ ...currentSong, id: mapVideoId[currentIndex - 1] })
      );
    } else {
      setAlertMessage("you reached at first");
    }
  };

  useEffect(() => {
    localStorage.setItem("currentSongInfo", JSON.stringify(currentSong));
  }, [currentSong]);

  // web media session
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songsInfo[0]?.snippet?.title,
        album: songsInfo[0]?.snippet?.channelTitle,
        artwork: [
          {
            src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            sizes: "512x512",
            type: "image/png",
          },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        audioRef.current.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current.pause();
        setIsPlaying(false);
      });

      if (currentIndex > 0) {
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          handlePrev();
        });
      } else {
        // Unset the "previoustrack" action handler at the end of a list.
        navigator.mediaSession.setActionHandler("previoustrack", null);
      }

      if (currentIndex < mapVideoId.length - 1) {
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          handleNext();
        });
      } else {
        // Unset the "nexttrack" action handler at the end of a playlist.
        navigator.mediaSession.setActionHandler("nexttrack", null);
      }
    }
  }, [currentSong, songsInfo, currentIndex]);

  useEffect(() => {
    if (!miniPlayerActive) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }
  }, [miniPlayerActive]);

  // scrolling song title
  const titleContainerRef = useRef(null);
  const titleRef = useRef(null);
  const [isScrollTitle, setIsScrollTitle] = useState(false);
  useEffect(() => {
    if (
      titleRef.current?.clientWidth > titleContainerRef.current?.clientWidth
    ) {
      setIsScrollTitle(true);
    }
    // eslint-disable-next-line
  }, [titleRef.current]);

  // minimize player if back button press
  const { pathname } = useLocation();

  useEffect(() => {
    window.addEventListener("popstate", () => {
      if (!miniPlayerActive) {
        dispatch(addSongInfo({ ...currentSong, miniPlayerActive: true }));
      }
    });

    // eslint-disable-next-line
  }, [pathname]);

  // pause on toggle changes
  useEffect(() => {
    setIsPlaying(false);
  }, [activeToggle]);

  // reset on song id change
  useEffect(() => {
    setProgress({ loaded: 0, played: 0 });
    setAudioUrl("");
    setIsPlaying(autoPlay);
  }, [id]);

  return (
    <div
      className={`player-page-section ${
        miniPlayerActive ? "miniplayer-active" : ""
      }`}
    >
      <div className="bg-poster-wrapper">
        <img
          className="bg-poster-image"
          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          alt="song poster"
        />
      </div>
      {/* <Header /> */}
      {!miniPlayerActive ? (
        <div className="top-player-controll-wrapper">
          <button
            type="button"
            title="minimize"
            className="player-minimize-wrapper cur-pointer"
            onClick={() =>
              dispatch(addSongInfo({ ...currentSong, miniPlayerActive: true }))
            }
          >
            <BsChevronDown style={{ width: "100%", height: "100%" }} />
          </button>
          <PlayerMoreInfo
            id={id}
            playerInfo={playerInfo}
            setPlayerInfo={setPlayerInfo}
            audioFormat={audioFormat}
            setAudioFormat={setAudioFormat}
            setAlertMessage={setAlertMessage}
          />
        </div>
      ) : null}

      <SongDetailsModel
        id={id}
        playerInfo={playerInfo}
        setPlayerInfo={setPlayerInfo}
        audioUrl={audioUrl}
        songsInfo={songsInfo}
      />

      <div
        className={`player-section container ${
          miniPlayerActive ? "hide-main-player" : ""
        } `}
      >
        <div className="player-container">
          <Toggle
            toggleList={toggleList}
            activeToggle={activeToggle}
            setActiveToggle={setActiveToggle}
          />
          <div
            className={`player-song-image-wrapper ${
              !songsInfo[0]?.snippet.thumbnails?.maxres ? "small-hq-image" : ""
            }`}
          >
            {!isLoading && songsInfo.length ? (
              <img
                src={
                  songsInfo[0]?.snippet.thumbnails?.maxres
                    ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
                    : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                }
                alt="song-poster"
                className="player-song-image"
              />
            ) : (
              <SkeletonTheme
                baseColor="#747070"
                highlightColor="#615e5e"
                duration={2}
              >
                <Skeleton height={"200px"} />
              </SkeletonTheme>
            )}
            <ReactPlayer
              url={
                activeToggle === "video"
                  ? `https://www.youtube.com/watch?v=${id}`
                  : audioUrl
              }
              ref={reactPlayerRef}
              volume={volumeLevel}
              onReady={() => setAudioLoading(false)}
              playing={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              width={"100%"}
              height={"100%"}
              style={{
                position: "absolute",
                top: "0px",
              }}
              onProgress={(state) => setProgress(state)}
              onEnded={() => (autoPlay ? handleNext() : null)}
              onError={(e) => {
                // Check the error code
                console.log(e.target.error);
                if (
                  e.target.error.code === 4 ||
                  !e.target.error.message.length
                ) {
                  // Handle the 403 error
                  setAudioUrl("");
                  activeToggle === "audio" ? getSongAudioUrls() : null;
                }
              }}
            />
          </div>

          {!isLoading && songsInfo.length ? (
            <div
              className="player-song-title-channel-wrapper absolute-center"
              ref={titleContainerRef}
            >
              <p
                className={`player-song-title ${
                  isScrollTitle ? "player-song-title-scrolling" : ""
                }`}
                ref={titleRef}
              >
                {songsInfo[0]?.snippet?.title}
              </p>
              <p className="player-song-channel">
                • {songsInfo[0]?.snippet?.channelTitle}
              </p>
            </div>
          ) : (
            <div className="player-song-title-channel-wrapper absolute-center">
              <SkeletonTheme
                baseColor="#747070"
                highlightColor="#615e5e"
                duration={2}
              >
                <Skeleton width={"250px"} />
              </SkeletonTheme>
            </div>
          )}

          <PlayerControls
            audioRef={reactPlayerRef}
            progress={progress}
            audioLoading={audioLoading}
            songsList={songsList}
            volumeLevel={volumeLevel}
            setVolumeLevel={setVolumeLevel}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            handleNext={handleNext}
            handlePrev={handlePrev}
            autoPlay={autoPlay}
            setAutoPlay={setAutoPlay}
            currentIndex={currentIndex}
            mapVideoId={mapVideoId}
          />

          <div className={`${alertMessage ? "alert-message-wrapper" : "hide"}`}>
            <div className="alert-message">
              <small>{alertMessage}</small>
              <button
                type="button"
                title="close"
                className="absolute-center"
                onClick={() => setAlertMessage("")}
              >
                <RxCross2 size={15} />
              </button>
            </div>
          </div>
        </div>

        <RelatedSongs songsList={songsList} setSongsList={setSongsList} />
      </div>

      {miniPlayerActive ? (
        <MiniPlayer
          songsInfo={songsInfo}
          videoId={id}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          handleNext={handleNext}
          handlePrev={handlePrev}
          audioLoading={audioLoading}
          audioRef={reactPlayerRef}
          songsList={songsList}
          mapVideoId={mapVideoId}
          currentIndex={currentIndex}
          progress={progress}
        />
      ) : null}
    </div>
  );
};

export default Player;
