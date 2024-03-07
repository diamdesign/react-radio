import { useState, useEffect, useRef, createElement } from "react";
import { Routes, Route, useNavigate, Link, useParams } from "react-router-dom";
import "./App.css";

let blurElement = document.querySelector("#colorblur");

var favoriteChan = [];
var favoriteProg = [];

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

function getFromLocalStorage() {
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

favoriteChan = getFromLocalStorage();

function formatTime(inputDate) {
	// Extract the number of milliseconds from the date string
	const milliseconds = parseInt(inputDate.match(/\d+/)[0]);

	// Create a new Date object using the milliseconds
	const date = new Date(milliseconds);

	// Format the date as desired (e.g., using toLocaleString())
	const formattedDate = date.toLocaleString();
	return formattedDate;
}

function onlyTime(timeString) {
	// Extract the time part from the datetime string
	const timePart = timeString.split(" ")[1];

	// Remove the last three characters (seconds part)
	const formattedTime = timePart.slice(0, -3);

	return formattedTime;
}

function setPlayIndication() {
	const playerIdElement = document.querySelector(".playerthumb");
	const allElements = document.querySelectorAll(".channel");

	if (playerIdElement) {
		const playerId = playerIdElement.getAttribute("data-id");
		const color = playerIdElement.getAttribute("data-bg");

		blurElement.style.background = "#" + color;

		allElements.forEach((item) => {
			let id = item.getAttribute("data-id");
			if (id === playerId) {
				item.querySelector(".chanplaybtn").classList.add("pause");
			}
		});
	}
}

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

function StartPage({ setAudio }) {
	const [isLoading, setIsLoading] = useState(true);
	const [favchannels, setFavChannels] = useState([]);
	const [favprograms, setFavPrograms] = useState([]);
	const [schedule, setSchedule] = useState([]);

	const navigate = useNavigate();

	useEffect(() => {
		getFavoriteChannels();
	}, []);

	function fetchFavoriteChannels() {
		return fetchChannels().then((data) => {
			// Filter out only the channels with IDs present in favoriteChan
			const favoriteChannels = data.channels.filter((channel) =>
				favoriteChan.includes(channel.id)
			);
			saveFavChan();
			setFavChannels(favoriteChannels);
			return favoriteChannels;
		});
	}

	function fetchScheduleEpisodesForChannels(channels) {
		const currentDate = new Date();
		const formattedDate =
			currentDate.getFullYear() +
			"-" +
			("0" + (currentDate.getMonth() + 1)).slice(-2) +
			"-" +
			("0" + currentDate.getDate()).slice(-2);

		const scheduleProg = channels.map((chan) => {
			const url = `https://api.sr.se/api/v2/scheduledepisodes?channelid=${chan}&date=${formattedDate}&format=json`;

			return fetch(url).then((response) => response.json());
		});

		return Promise.all(scheduleProg);
	}

	function getFavoriteChannels() {
		fetchFavoriteChannels().then((favoriteChannels) => {
			// Extract the IDs from the favoriteChannels array
			const channelIds = favoriteChannels.map((channel) => channel.id);

			fetchScheduleEpisodesForChannels(channelIds)
				.then((results) => {
					// Process the results
					const channelData = results.map((data, index) => {
						return { channelId: channelIds[index], data: data };
					});

					// Set the schedule state to the resolved data
					setSchedule(channelData);
					setIsLoading(false);
					setPlayIndication();
				})
				.catch((error) => {
					console.error("Error fetching data:", error);
				});
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

	function handleChanClick(e, id) {
		navigate("/kanal/" + id);
	}

	function handleProgClick(e, id) {
		navigate("/program/" + id);
	}

	return (
		<div id="channels">
			<div className="chancontainer">
				{favoriteChan && favoriteChan.length > 0 ? (
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
				) : (
					<>{navigate("/kanaler/")}</>
				)}
				<h1>Favorit program</h1>
				{schedule && schedule.length > 0 && (
					<>
						<h1>
							Radio tablå <span>(för favoriserade kanaler)</span>
						</h1>
						<div id="tabla">
							<div className="tabla-container">
								{isLoading && (
									<div id="scheduleloader">
										<div className="loader"></div>
									</div>
								)}
								{!isLoading &&
									schedule.map((chan, index) => (
										<div
											key={index} // Adding a key to the outer div is necessary when using map
											id={chan.channelId}
											className="tabla-item"
										>
											<div className="rowheader">
												{chan.data.schedule[0].channel.name}
											</div>
											{chan.data.schedule.map((prog, listindex) => (
												<div
													className="tabla-program"
													key={listindex}
													data-progid={prog.program.id}
													onClick={(e) => {
														handleProgClick(e, prog.program.id);
													}}
												>
													<div className="image">
														<img src={prog.imageurl} alt="" />
													</div>

													<div className="tabla-info">
														<div className="time">
															<span>
																Sänds:{" "}
																{onlyTime(
																	formatTime(prog.starttimeutc)
																)}{" "}
																-{" "}
																{onlyTime(
																	formatTime(prog.endtimeutc)
																)}
															</span>
														</div>
														<div className="title">{prog.title}</div>
														<div className="description">
															{prog.description}
														</div>
													</div>
												</div>
											))}
										</div>
									))}
							</div>
						</div>
					</>
				)}
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

			setPlayIndication();
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

	function handleChanClick(e, id) {
		navigate("/kanal/" + id);
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
							data-id={chan.id}
							onClick={(e) => handleChanPlay(e, chan.id)}
						></div>
						<div className="desc" style={{ background: `#${chan.color}` }}>
							{chan.tagline}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ChannelDetails({ setAudio }) {
	let { channelId } = useParams();

	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [channelData, setChannelData] = useState(null);
	const [scheduleData, setSchedule] = useState(null);
	const [showPrograms, setShowPrograms] = useState(null);

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
				const firstPageUrl = `https://api.sr.se/v2/scheduledepisodes?channelid=${channelId}&format=json&size=2000`;
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

				const playerIdElement = document.querySelector(".playerthumb");
				const playBtnElement = document.querySelector(".chanplaybtn");

				if (playerIdElement && playBtnElement) {
					const playerId = playerIdElement.getAttribute("data-id");
					const playBtnId = playBtnElement.getAttribute("data-id");

					if (playBtnId === playerId) {
						document.querySelector(".chanplaybtn").classList.add("pause");
					}
				}

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

			const btnfavchan = document.querySelector(".btn-favchan");

			if (favoriteChan.includes(parseInt(channelId))) {
				btnfavchan.classList.add("favorited");
			} else {
				btnfavchan.classList.remove("favorited");
			}
		});
	}, [channelId]);

	function handleAllProgramClick(id) {
		async function getChannelPrograms(id) {
			const response = await fetch(
				"http://api.sr.se/api/v2/programs/index?channelid=" + id + "&format=json&size=10000"
			);
			const data = response.json();
			return data;
		}
		getChannelPrograms(id).then((data) => {
			setShowPrograms(data.programs);
			console.log(data.programs);
		});
	}

	function handleProgClick(e, id) {
		navigate("/program/" + id);
	}

	return (
		<div id="channels">
			{channelData && (
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
								data-id={channelData.channel.id}
								onClick={(e) => handleChanPlay(e, channelData.channel.id)}
							></div>
							<div
								className="btn-favchan"
								data-id={channelData.channel.id}
								onClick={(e) => handleChanPlay(e, channelData.channel.id)}
							></div>
							{showPrograms && showPrograms.length > 0 ? (
								<div className="programs" onClick={() => setShowPrograms(null)}>
									Dagens schema
								</div>
							) : (
								<div
									className="programs"
									onClick={() => handleAllProgramClick(channelData.channel.id)}
								>
									Alla program
								</div>
							)}

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
				{showPrograms && showPrograms.length > 0 ? (
					<>
						{isLoading && (
							<div id="scheduleloader">
								<div className="loader"></div>
							</div>
						)}
						{!isLoading && (
							<>
								<h2>Alla program</h2>
								<div className="chancontainer">
									{showPrograms.map((prog) => (
										<div
											className="program-item"
											data-progid={prog.id}
											data-id={prog.channel.id}
											key={prog.id}
											onClick={(e) => {
												handleProgClick(e, prog.id);
											}}
										>
											<div className="btn-favprog"></div>
											<div className="image">
												<img src={prog.programimage} alt="" />
											</div>
											<div className="proginfo">
												<div className="title">{prog.name}</div>
												<div className="desc">{prog.description}</div>
												{prog.haspod && <div className="icon-pod"></div>}
											</div>
										</div>
									))}
								</div>
							</>
						)}
					</>
				) : (
					// Content to render when showPrograms is not set
					<>
						{isLoading && (
							<div id="scheduleloader">
								<div className="loader"></div>
							</div>
						)}
						{!isLoading && <h2>Dagens schema</h2>}
						{!isLoading &&
							scheduleData.map((item, index) => (
								<div
									className="schedule-item"
									key={index}
									data-progid={item.program.id}
									onClick={(e) => {
										handleProgClick(e, item.program.id);
									}}
								>
									<div className="schedule-image">
										<img src={item.imageurl} />
									</div>
									<div className="schedule-info">
										<h2>{item.program.name}</h2>
										<p>{item.description}</p>
										<p>
											<span>
												Sänds: {onlyTime(formatTime(item.starttimeutc))} -{" "}
												{onlyTime(formatTime(item.endtimeutc))}
											</span>
										</p>
									</div>
								</div>
							))}
					</>
				)}
			</div>
		</div>
	);
}

function ProgramPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [programs, setPrograms] = useState([]);
	const [listAmount, setListAmount] = useState(50);
	const navigate = useNavigate();

	async function getPrograms() {
		const response = await fetch("https://api.sr.se/api/v2/programs?format=json&size=10000");
		const data = await response.json();
		setIsLoading(false);
		return data;
	}

	let allPrograms = [];

	const handleScroll = () => {
		const channelsElement = document.querySelector("#channels");
		if (
			Math.ceil(channelsElement.clientHeight + channelsElement.scrollTop + 10) >
			channelsElement.scrollHeight
		) {
			loadMorePrograms();
		}
	};

	useEffect(() => {
		getPrograms().then((data) => {
			allPrograms = data.programs.slice(0, listAmount);

			setPrograms(allPrograms);
			setPlayIndication();
		});
	}, [listAmount]);

	function loadMorePrograms() {
		const channelsElement = document.querySelector("#channels");
		const newAmount = listAmount + 50;
		setListAmount(newAmount);
		channelsElement.removeEventListener("scroll", handleScroll);
	}

	useEffect(() => {
		const channelsElement = document.querySelector("#channels");

		channelsElement.addEventListener("scroll", handleScroll);
	}, [programs]);

	function handleProgClick(e, id) {
		navigate("/program/" + id);
	}

	return (
		<>
			<div id="channels">
				<div className="chancontainer">
					{isLoading && (
						<div id="scheduleloader">
							<div className="loader"></div>
						</div>
					)}

					{!isLoading && <h1>Program</h1>}

					{!isLoading &&
						programs.map((prog, index) => (
							<div
								className="program-item"
								key={index}
								data-progid={prog.id}
								data-id={prog.channel.id}
								onClick={(e) => {
									handleProgClick(e, prog.id);
								}}
							>
								<div className="btn-favprog"></div>
								<div className="image">
									<img src={prog.programimage} alt="" />
								</div>
								<div className="proginfo">
									<div className="chan">{prog.channel.name}</div>
									<div className="title">{prog.name}</div>
									<div className="desc">{prog.description}</div>
									{prog.haspod && <div className="icon-pod"></div>}
								</div>
							</div>
						))}
				</div>
			</div>
		</>
	);
}

function ProgramDetails({ setAudio }) {
	let { programId } = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [program, setProgram] = useState(null);
	const navigate = useNavigate();

	async function getProgram(programId) {
		const response = await fetch(
			"http://api.sr.se/api/v2/programs/" + programId + "?format=json&size=2000"
		);
		const data = await response.json();
		setIsLoading(false);
		return data.program;
	}

	useEffect(() => {
		getProgram(programId).then((data) => {
			console.log(data);
			setProgram(data);
			setPlayIndication();
			setIsLoading(false);
		});
	}, []);

	function handleChanClick(id) {
		navigate("/kanal/" + id);
	}
	function handleCatClick(id) {
		navigate("/program/category/" + id);
	}

	return (
		<>
			<div id="channels">
				{isLoading && <div className="loader"></div>}
				{!isLoading && program && (
					<div id="top">
						<div className="channel-image">
							<img src={program.programimage} />
						</div>
						<div className="channel-info" id="proginfo">
							<h1>{program.name}</h1>
							{program.channel.name !== "[No channel]" && (
								<span
									data-id={program.channel.id}
									onClick={() => handleChanClick(program.channel.id)}
									className="chanbutton"
								>
									{program.channel.name}
								</span>
							)}
							{program.programcategory.id !== null && (
								<span
									data-catid={program.programcategory.id}
									onClick={() => handleCatClick(program.programcategory.id)}
									className="chanbutton"
								>
									{program.programcategory.name}
								</span>
							)}
							<p>{program.description}</p>
							<p>{program.broadcastinfo}</p>

							<div className="buttons">
								<div
									className="btn-favchan"
									data-id={program.channel.id}
									onClick={(e) => handleChanPlay(e, program.id)}
								></div>

								<a
									className="website"
									href={program.programurl}
									target="_blank"
									rel="noopener noreferrer"
								>
									Hemsida
								</a>
								{program.haspod && <div className="icon-pod"></div>}
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

function Player({ audio }) {
	const navigate = useNavigate();
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
					<div
						className="playerthumb"
						data-id={audio.id}
						data-bg={audio.color}
						onClick={(e) => {
							handleChanClick(e, audio.id);
						}}
					>
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
				<Route path="/program" element={<ProgramPage />}></Route>
				<Route
					path="/program/:programId"
					element={<ProgramDetails setAudio={setAudio} />}
				></Route>
			</Routes>
			<Player audio={audio} setAudio={setAudio} />
			<div id="colorblur"></div>
		</>
	);
}

export default App;
