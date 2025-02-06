import React from 'react';
import { TextProps as InkTextProps } from 'ink';
import { Transform, Text as InkText } from 'ink';

export type TextProps = {
	children: React.ReactNode;
	trimWrap?: boolean;
} & InkTextProps;

export const Text = ({ children, trimWrap = true, ...props }: TextProps) => (
	<Transform
		transform={(line, index) =>
			index === 0 ? line : (trimWrap ? line.trimStart() : line)}
	>
		<InkText {...props}>{children}</InkText>
	</Transform>
);
