import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, Link, useParams } from "react-router-dom";
import "./App.css";

function Header() {
	const [search, setSearch] = useState(null);

	return (
		<div id="header">
			<Link to="/" className="logo">
				SR
			</Link>
			<Link to="/">Kanaler</Link>
			<Link to="/program">Program</Link>
			<input
				type="text"
				id="search"
				placeholder="Sök program..."
				value={search}
				onChange={(e) => {
					handleSearchInput(e);
				}}
			/>
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

const blurElement = document.querySelector("#colorblur");

function ChannelPage({ setAudio, channels }) {
	const navigate = useNavigate();

	function handleChanPlay(e, id) {
		e.stopPropagation();

		const target = e.target;
		const isPaused = target.classList.contains("pause");

		document.querySelectorAll(".chanplaybtn").forEach((btn) => {
			btn.classList.remove("pause");
		});

		fetchChannels(id).then((data) => {
			console.log(data.channel);
			if (isPaused) {
				target.classList.remove("pause");
				blurElement.style.background = "gray";
				setAudio(null);
			} else {
				target.classList.add("pause");
				blurElement.style.background = "#" + data.channel.color;
				setAudio(data.channel); // Set channels state
			}
		});

		console.log("Play audio for channel ID:", id);
	}

	function handleChanClick(e, id) {
		navigate("/channel/" + id);
	}

	return (
		<div id="channels">
			<h1>Kanaler</h1>
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

function ChannelDetails({ setAudio, channels }) {
	let { channelId } = useParams();
	console.log(channelId);
	// Filter the channels array to find the channel with the matching ID
	const selectedChannel = channels.filter((channel) => channel.id === parseInt(channelId));
	console.log(selectedChannel);

	blurElement.style.background = "#" + selectedChannel[0].color;

	return (
		<div id="channels">
			<div id="top">
				<div className="channel-image">
					<img src={selectedChannel[0].image} />
				</div>
				<div className="channel-info">
					<h1>{selectedChannel[0].name}</h1>
					<span>{selectedChannel[0].channeltype}</span>
					<div className="chanplaybtn" onClick={(e) => handleChanPlay(e, chan.id)}></div>
				</div>
			</div>
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
			<Routes>
				<Route
					path="/"
					element={<ChannelPage channels={channels} setAudio={setAudio} />}
				></Route>
				<Route
					path="/channel/:channelId"
					element={<ChannelDetails channels={channels} setAudio={setAudio} />}
				></Route>
			</Routes>
			<Player audio={audio} setAudio={setAudio} />
			<div id="colorblur"></div>
		</>
	);
}

export default App;
