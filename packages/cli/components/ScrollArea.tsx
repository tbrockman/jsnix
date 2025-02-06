// Based on: https://github.com/vadimdemedes/ink/issues/432#issuecomment-1519671092

import { Box, DOMElement, measureElement, useInput } from 'ink';
import React, { useEffect, useRef, useState } from 'react';

export type ScrollAreaProps = {
	height: number;
	children: React.ReactNode;
	notifyInnerHeight?: (height: number) => void;
};

export default function ScrollArea({ height, children, notifyInnerHeight }: ScrollAreaProps) {
	const ref = useRef<DOMElement>(null);
	const [innerHeight, setInnerHeight] = useState(height);
	const [scrollTop, setScrollTop] = useState(0);

	const scroll = (amount: number) => {
		if (innerHeight > height) {
			if (amount > 0) {
				setScrollTop((prev) => Math.min(innerHeight - height, prev + amount));
			}
			else if (amount < 0) {
				setScrollTop((prev) => Math.max(0, prev + amount));
			}
		}
	};

	useEffect(() => {
		notifyInnerHeight?.(innerHeight);
	}, [innerHeight]);

	useEffect(() => {
		if (ref.current) {
			const dimensions = measureElement(ref.current);
			setInnerHeight(dimensions.height);
			if (dimensions.height < height) {
				setScrollTop(0);
			}
		}
	}, [ref, height]);

	useInput((_input, key) => {
		if (key.upArrow) {
			scroll(-1);
		}

		if (key.downArrow) {
			scroll(1);
		}

		if (key.pageUp) {
			scroll(-height);
		}

		if (key.pageDown) {
			scroll(height);
		}
	});

	return (
		<Box height={height} flexDirection="column" overflow="hidden">
			<Box
				ref={ref}
				flexShrink={0}
				flexDirection="column"
				marginTop={-scrollTop}
			>
				{children}
			</Box>
		</Box>
	);
}
