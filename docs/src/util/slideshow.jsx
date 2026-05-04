import React, { useEffect, useState } from 'react';

const slides = [
	{
		name: 'Windows (dark)',
		src: '/img/Files_dark.webp',
		alt: 'Files dark on Windows',
	},
	{
		name: 'Garuda Linux (Shades of Purple)',
		src: '/img/Files_linux.webp',
		alt: 'Files shades of purple on Linux',
	},
	{
		name: 'macOS (dark)',
		src: '/img/Files_mac_dark.webp',
		alt: 'Files dark on macOS',
	},
	{
		name: 'Windows (light)',
		src: '/img/Files_light.webp',
		alt: 'Files light on Windows',
	},
	{
		name: 'Windows (dark+)',
		src: '/img/Files_dark+.webp',
		alt: 'Files dark+ on Windows',
	},
	{
		name: 'macOS (light+)',
		src: '/img/Files_mac_light.webp',
		alt: 'Files light+ on macOS',
	},
];

const SLIDE_INTERVAL = 2500;

export default function Slideshow() {
	const [index, setIndex] = useState(0);
	const [handle, setHandle] = useState(null);

	const destroyIntervalTimer = () => {
		clearInterval(handle);
		setHandle(null);
	};

	const createIntervalTimer = () => {
		destroyIntervalTimer();
		setHandle(setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_INTERVAL));
	};

	const handleSlideSelect = (idx) => {
		createIntervalTimer();
		setIndex(idx);
	};

	useEffect(() => {
		createIntervalTimer();
		return destroyIntervalTimer;
	}, []);

	return (
		<>
			<div className="slideshow-container">
				{slides.map((e, i) => (
					<div key={i} className={`slide${index === i ? ' active' : ''}`}>
						<div className="slide-numbertext">
							{i + 1} / {slides.length}
						</div>

						<img src={e.src} alt={e.alt} />
						<p className="slide-caption">{e.name}</p>
					</div>
				))}
			</div>

			<div className="slide-dots">
				{slides.map((e, i) => (
					<span onClick={() => handleSlideSelect(i)} key={e.name} className={`slide-dot${i === index ? ' active' : ''}`} />
				))}
			</div>
		</>
	);
}
