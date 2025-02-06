import { Box, DOMElement, measureElement, Text, useInput } from 'ink';
import React, { useEffect, useRef, useState } from 'react';
import ScrollArea from '@jsnix/cli/components/ScrollArea';
import useStdoutDimensions from '@jsnix/cli/hooks/useStdoutDimensions';

type LegendProps = {
	ref: React.RefObject<DOMElement>;
	hasScroll: boolean;
};

const Legend = ({ ref, hasScroll }: LegendProps) => {
	// TODO: figure out why 'hasScroll' doesn't work in the browser
	hasScroll;

	return (
		<Box ref={ref} gap={1} justifyContent="space-between">
			<Text>
				exit (
				<Text color="green">q</Text>
				{' or '}
				<Text color="green">esc</Text>
				)
			</Text>
			<Text>
				scroll (
				<Text color="green">↑/pgup</Text>
				{' or '}
				<Text color="green">↓/pgdn</Text>
				)
			</Text>
		</Box>
	);
};

export type ScrollerProps = {
	height?: number;
	onExit?: () => void;
	children: React.ReactNode;
};

export default function Scroller({ height, onExit, children }: ScrollerProps) {
	const { rows } = useStdoutDimensions();
	const legendRef = useRef<any>(null);
	const [legendHeight, setLegendHeight] = useState(0);
	const [innerHeight, setInnerHeight] = useState(0);
	const boxHeight = height || rows;
	const hasScroll = innerHeight > (boxHeight - legendHeight);

	useInput((input, key) => {
		if (input === 'q' || key.escape) {
			onExit && onExit();
		}
	});

	useEffect(() => {
		if (legendRef.current) {
			const { height } = measureElement(legendRef.current);
			setLegendHeight(height);
		}
	}, [legendRef]);

	return (
		<Box height={boxHeight} flexDirection="column">
			<Box borderStyle="single" borderColor="greenBright" paddingLeft={2} paddingRight={2}>
				{/* account for the borders in the available height passed to the scroll area */}
				<ScrollArea height={boxHeight - legendHeight - 3} notifyInnerHeight={setInnerHeight}>
					{children}
				</ScrollArea>
			</Box>
			<Legend ref={legendRef} hasScroll={hasScroll} />
		</Box>
	);
}
