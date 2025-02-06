import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

type SpinnerProps = {
	interval: number;
	frames: string[];
};

export default function Spinner({ frames, interval }: SpinnerProps) {
	const [frame, setFrame] = useState<number>(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setFrame((previousFrame) => (previousFrame + 1) % frames.length);
		}, interval);

		return () => {
			clearInterval(timer);
		};
	}, [frames, interval]);
	return <Text>{frames[frame]}</Text>;
};
