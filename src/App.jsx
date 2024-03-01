import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Header() {
	return (
		<div id="header">
			<a href="#">Hello</a>
		</div>
	);
}

async function fetchChannels(id = "") {
	let url;
	if (id === null || id === "") {
		url = "https://api.sr.se/api/v2/channels?format=json";
	} else {
		url = "https://api.sr.se/api/v2/channels/" + id + "?format=json";
	}
	try {
		const response = await fetch(url);
		const data = await response.json();

		return data;
	} catch (error) {
		console.error("Error fetching channels:", error);
	}
}

function ChannelPage({ setAudio, channels }) {
	const navigate = useNavigate();

	function handleChanPlay(e, id) {
		e.stopPropagation();
		const target = e.target;
		const isPaused = target.classList.contains("pause");

		document.querySelectorAll(".chanplaybtn").forEach((btn) => {
			btn.classList.remove("pause");
		});

		if (isPaused) {
			target.classList.remove("pause");
		} else {
			target.classList.add("pause");
		}

		fetchChannels(id).then((data) => {
			console.log(data.channel);
			setAudio(data.channel); // Set channels state
		});
		console.log("Play audio for channel ID:", id);
	}

	function handleChanClick(e, id) {
		navigate("/channel/" + id);
	}

	return (
		<div id="channels">
			{channels.map((chan, index) => (
				<div
					className="channel"
					key={index}
					style={{ background: `#${chan.color}` }}
					data-id={chan.id}
					onClick={(e) => handleChanClick(e, chan.id)}
				>
					<div className="image">
						<img src={chan.image} alt="" />
					</div>
					<span>{chan.channeltype}</span>
					<div className="chanplaybtn" onClick={(e) => handleChanPlay(e, chan.id)}></div>
				</div>
			))}
		</div>
	);
}

function Player({ audio }) {
	const audioRef = useRef(null);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.load(); // Load the new audio source
			audioRef.current.play(); // Play the audio
		}
	}, [audio]);

	// Placeholder for the Player component
	return (
		<div id="player">
			{audio !== null && audio !== "" && (
				<>
					<div className="playerthumb">
						<img src={audio.image} alt="" />
					</div>
					<audio ref={audioRef} autoPlay controls>
						<source src={audio.liveaudio.url} type="audio/mpeg" />
					</audio>
				</>
			)}
		</div>
	);
}

function App() {
	const [channels, setChannels] = useState([]);
	const [audio, setAudio] = useState(null); // Define 'audio' state

	useEffect(() => {
		fetchChannels().then((data) => {
			setChannels(data.channels); // Set channels state
		});
	}, []);

	return (
		<>
			<Header />
			<ChannelPage channels={channels} setAudio={setAudio} />
			<Player audio={audio} setAudio={setAudio} /> {/* Pass 'audio' as a prop */}
		</>
	);
}

export default App;
