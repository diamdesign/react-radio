import { useState, useEffect, useRef, createElement } from "react";
import { Routes, Route, useNavigate, Link, useParams } from "react-router-dom";
import "./App.css";

function Header() {
	const [search, setSearch] = useState("");

	function handleSearchInput(e) {
		e.preventDefault();
		setSearch(e.target.value);
	}

	return (
		<div id="header">
			<Link to="/" className="logo">
				SR
			</Link>
			<Link to="/kanaler">Kanaler</Link>
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
		url = "https://api.sr.se/api/v2/channels?size=500&format=json";
	} else {
		url = "https://api.sr.se/api/v2/channels/" + parseInt(id) + "?format=json";
	}
	try {
		const response = await fetch(url);
		const data = await response.json();

		return data;
	} catch (error) {
		console.error("Error fetching channels:", error);
	}
}

let blurElement = document.querySelector("#colorblur");

var favoriteChan = [];
function getFavoriteChanFromLocalStorage() {
	const favoriteChanString = localStorage.getItem("favoriteChan");
	if (favoriteChanString) {
		return JSON.parse(favoriteChanString);
	} else {
		return [];
	}
}

function saveFavChan() {
	localStorage.setItem("favoriteChan", JSON.stringify(favoriteChan));
}

favoriteChan = getFavoriteChanFromLocalStorage();

function StartPage({ setAudio }) {
	const [favchannels, setFavChannels] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		getFavoriteChannels();
	}, [favchannels]);

	function getFavoriteChannels() {
		fetchChannels().then((data) => {
			// Filter out only the channels with IDs present in favoriteChan
			const favoriteChannels = data.channels.filter((channel) =>
				favoriteChan.includes(channel.id)
			);
			saveFavChan();
			setFavChannels(favoriteChannels);
		});
	}

	function handleChanPlay(e, id) {
		e.stopPropagation();

		const target = e.target;
		const isPaused = target.classList.contains("pause");

		document.querySelectorAll(".chanplaybtn").forEach((btn) => {
			btn.classList.remove("pause");
		});

		fetchChannels(id).then((data) => {
			if (isPaused) {
				target.classList.remove("pause");
				blurElement.style.background = "gray";
				setAudio(null);
			} else {
				target.classList.add("pause");
				blurElement = document.querySelector("#colorblur");
				blurElement.style.background = "#" + data.channel.color;
				setAudio(data.channel); // Set channels state
			}
		});

		console.log("Play audio for channel ID:", id);
	}

	function handleChanClick(e, id) {
		navigate("/kanal/" + id);
	}

	function addChannel(e, id) {
		e.stopPropagation();
		let channel = document.querySelector(`.channel[data-id="${id}"]`);

		// Check if the channel is favorited
		if (channel.classList.contains("favorited")) {
			// If the channel is favorited, remove the ID from favoriteChan
			favoriteChan = favoriteChan.filter((chanId) => chanId !== id);
		} else {
			// If the channel is not favorited, add the ID to favoriteChan
			favoriteChan.push(id);
		}

		saveFavChan(favoriteChan);

		// Update the favorite channels based on the modified favoriteChan array
		getFavoriteChannels();
	}

	return (
		<div id="channels">
			<div className="chancontainer">
				{favoriteChan && favoriteChan.length > 0 && (
					<>
						<h1>Favorit kanaler</h1>
						{favchannels.map((chan, index) => (
							<div
								className="channel favorited"
								key={index}
								style={{ background: `#${chan.color}` }}
								data-id={chan.id}
								onClick={(e) => handleChanClick(e, chan.id)}
							>
								<div className="image">
									<img src={chan.image} alt="" />
								</div>
								<span>{chan.channeltype}</span>
								<div
									className="btn-favchan"
									onClick={(e) => addChannel(e, chan.id)}
								></div>
								<div
									className="chanplaybtn"
									onClick={(e) => handleChanPlay(e, chan.id)}
								></div>
							</div>
						))}
					</>
				)}
				<h1>Favorit program</h1>

				<h1>Schema</h1>
			</div>
		</div>
	);
}

function ChannelPage({ setAudio }) {
	const [channels, setChannels] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		fetchChannels().then((data) => {
			setChannels(data.channels); // Set channels state
		});
	}, []);

	useEffect(() => {
		// Only run this effect when channels state has been updated
		if (channels.length > 0) {
			const channelElements = document.querySelectorAll(".channel");

			channelElements.forEach((element) => {
				const id = parseInt(element.getAttribute("data-id").trim(), 10); // Convert id to number
				if (favoriteChan.includes(id)) {
					element.classList.add("favorited");
				} else {
					element.classList.remove("favorited");
				}
			});
		}
	}, [channels, favoriteChan]);

	function handleChanPlay(e, id) {
		e.stopPropagation();

		const target = e.target;
		const isPaused = target.classList.contains("pause");

		document.querySelectorAll(".chanplaybtn").forEach((btn) => {
			btn.classList.remove("pause");
		});

		fetchChannels(id).then((data) => {
			if (isPaused) {
				target.classList.remove("pause");
				blurElement.style.background = "gray";
				setAudio(null);
			} else {
				target.classList.add("pause");
				blurElement = document.querySelector("#colorblur");
				blurElement.style.background = "#" + data.channel.color;
				setAudio(data.channel); // Set channels state
			}
		});

		console.log("Play audio for channel ID:", id);
	}

	function handleChanClick(e, id) {
		navigate("/kanal/" + id);
	}

	function addChannel(e, id) {
		e.stopPropagation();
		const index = favoriteChan.indexOf(id); // Check if id is already in favoriteChan
		if (index !== -1) {
			favoriteChan.splice(index, 1); // If found, remove id from favoriteChan
		} else {
			favoriteChan.push(id); // If not found, add id to favoriteChan
		}
		saveFavChan(favoriteChan); // Save the updated favoriteChan to localStorage
		// Toggle the "favorited" class for the corresponding element in the UI
		const element = e.target.closest(".channel");
		if (element) {
			element.classList.toggle("favorited");
		}
	}

	return (
		<div id="channels">
			<div className="chancontainer">
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
						<div className="btn-favchan" onClick={(e) => addChannel(e, chan.id)}></div>
						<div
							className="chanplaybtn"
							onClick={(e) => handleChanPlay(e, chan.id)}
						></div>
					</div>
				))}
			</div>
		</div>
	);
}

function formatTime(inputDate) {
	// Extract the number of milliseconds from the date string
	const milliseconds = parseInt(inputDate.match(/\d+/)[0]);

	// Create a new Date object using the milliseconds
	const date = new Date(milliseconds);

	// Format the date as desired (e.g., using toLocaleString())
	const formattedDate = date.toLocaleString();
	return formattedDate;
}

function ChannelDetails({ setAudio, channels }) {
	let { channelId } = useParams();

	const [page, setPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [channelData, setChannelData] = useState(null);
	const [scheduleData, setSchedule] = useState(null);

	function handleChanPlay(e, id) {
		e.stopPropagation();

		const target = e.target;
		const isPaused = target.classList.contains("pause");

		fetchChannels(id).then((data) => {
			if (isPaused) {
				target.classList.remove("pause");
				setAudio(null);
			} else {
				target.classList.add("pause");
				setAudio(data.channel); // Set channels state
			}
		});

		console.log("Play audio for channel ID:", id);
	}

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const pageParam = params.get("page");
		const currentPage = pageParam ? parseInt(pageParam) : 1;
		setPage(currentPage);

		const fetchData = async () => {
			try {
				let allEpisodes = [];
				const data = await fetchChannels(channelId);
				setChannelData(data);

				// Fetch the first page to get total number of pages
				const firstPageUrl = `https://api.sr.se/v2/scheduledepisodes?channelid=${channelId}&format=json`;
				const firstResponse = await fetch(firstPageUrl);
				const firstData = await firstResponse.json();

				// Get the total number of pages from the pagination data
				const totalPages = firstData.pagination.totalpages;

				// Add episodes from the first page to the array
				allEpisodes = allEpisodes.concat(firstData.schedule);

				// Fetch remaining pages and add their episodes to the array
				for (let page = 2; page <= totalPages; page++) {
					const pageUrl = `https://api.sr.se/v2/scheduledepisodes?channelid=${channelId}&format=json&page=${page}`;
					const response = await fetch(pageUrl);
					const data = await response.json();
					allEpisodes = allEpisodes.concat(data.schedule);
				}

				// Get the current time
				const currentTime = new Date();
				const year = currentTime.getFullYear();
				const month = String(currentTime.getMonth() + 1).padStart(2, "0"); // Adding 1 to month since January is 0
				const day = String(currentTime.getDate()).padStart(2, "0");
				const hour = String(currentTime.getHours()).padStart(2, "0");
				const minute = String(currentTime.getMinutes()).padStart(2, "0");
				const second = String(currentTime.getSeconds()).padStart(2, "0");

				const formattedCurrentTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

				// Filter out episodes whose end time is greater than the current time
				const filteredSchedule = allEpisodes.filter((episode) => {
					const endTime = formatTime(episode.endtimeutc);
					// Create a new Date object using the milliseconds
					return endTime > formattedCurrentTime;
				});
				setSchedule(filteredSchedule);
				setIsLoading(false);

				return data;
			} catch (error) {
				console.error("Error fetching data:", error);
				setIsLoading(false);
			}
		};

		fetchData().then((data) => {
			// Ensure data is not null before accessing its properties
			const blurElement = document.getElementById("colorblur");
			blurElement.style.background = "#" + data.channel.color;
		});
	}, [channelId]);

	return (
		<div id="channels">
			{channelData && ( // Render JSX only when channelData is available
				<div id="top">
					<div className="channel-image">
						<img src={channelData.channel.image} />
					</div>
					<div className="channel-info">
						<h1>{channelData.channel.name}</h1>
						<span>{channelData.channel.channeltype}</span>
						<p>{channelData.channel.tagline}</p>
						<div className="buttons">
							<div
								className="chanplaybtn"
								onClick={(e) => handleChanPlay(e, channelData.channel.id)}
							></div>
							<a
								className="website"
								href={channelData.channel.siteurl}
								target="_blank"
								rel="noopener noreferrer"
							>
								Hemsida
							</a>
						</div>
					</div>
				</div>
			)}
			<div id="schedule">
				{isLoading && (
					<div id="scheduleloader">
						<div className="loader"></div>
					</div>
				)}
				{!isLoading &&
					scheduleData.map((item, index) => (
						<div className="schedule-item" key={index}>
							<div className="schedule-image">
								<img src={item.imageurl} />
							</div>
							<div className="schedule-info">
								<h2>{item.program.name}</h2>
								<p>{item.description}</p>
								<p>
									<span>Från: {formatTime(item.starttimeutc)}</span>
									<span>Till: {formatTime(item.endtimeutc)}</span>
								</p>
							</div>
						</div>
					))}
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
					{console.log(audio)}
					<div className="playerthumb" data-id={audio.id}>
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
	const [audio, setAudio] = useState(null); // Define 'audio' state

	return (
		<>
			<Header />
			<Routes>
				<Route path="/" element={<StartPage setAudio={setAudio} />}></Route>
				<Route path="/kanaler" element={<ChannelPage setAudio={setAudio} />}></Route>
				<Route
					path="/kanal/:channelId"
					element={<ChannelDetails setAudio={setAudio} />}
				></Route>
			</Routes>
			<Player audio={audio} setAudio={setAudio} />
			<div id="colorblur"></div>
		</>
	);
}

export default App;
