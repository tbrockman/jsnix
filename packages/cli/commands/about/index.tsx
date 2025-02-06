import React from 'react';
import { Box, useApp } from 'ink';
import BigText from 'ink-big-text';
import Scroller from '@jsnix/cli/components/Scroller';
import { Text } from '@jsnix/cli/components/Text';

export const example = ['about'];
export const description = '📖 learn more';

export default function About() {
	const { exit } = useApp();

	const onExit = () => {
		exit();
	};

	return (
		<Scroller onExit={onExit}>
			<Box><BigText text="about" font="tiny" /></Box>
			<Box flexDirection="column" gap={1}>
				<Text color="greenBright" inverse>what is this?</Text>
				<Box paddingLeft={2} flexDirection="column">
					<Text>this is a virtual machine running node.js completely in your browser.</Text>
					<Text>in it, you can install 📦 npm packages, 📁 write files, and ▶️ run commands.</Text>
					<Box paddingTop={1} columnGap={1}>
						<Text color="yellow">hint:</Text>
						<Text>
							try running "
							<Text color="blue" inverse>jsnix --help</Text>
							"
						</Text>
					</Box>
					<Box columnGap={1}>
						<Text color="red">caution:</Text>
						<Text>all data is (currently) lost on closing</Text>
					</Box>
				</Box>
			</Box>
			<Box flexDirection="column" gap={1} paddingTop={1}>
				<Text color="greenBright" inverse>why?</Text>
				<Box paddingLeft={2} flexDirection="column">
					<Text>rather than just share a web app, i thought it'd be cool to share a whole 💻 computer.</Text>
				</Box>
			</Box>
			<Box flexDirection="column" gap={1} paddingTop={1}>
				<Text color="greenBright" inverse>how?</Text>
				<Box paddingLeft={2} flexDirection="column">
					<Text>
						currently, its powered by a stackblitz webcontainer, and uses xterm.js + monaco-editor
						for the ⌨️ terminal and 📝 editor.
					</Text>
				</Box>
			</Box>
			<Box flexDirection="column" gap={1} paddingTop={1}>
				<Text color="yellowBright" inverse>limitations</Text>
				<Box paddingLeft={2} flexDirection="column">
					<Text>🔌 no raw tcp/udp sockets</Text>
					<Text>🔒 cors requests only</Text>
					<Text>👴 vm is stuck on node@18</Text>
					<Text>🪦 webcontainers randomly die without any error logs</Text>
					<Text>🐌 bit less than native performance</Text>
					<Text>💩 consumes a poopload of ram</Text>
					<Text>🤔 `jsh`, an undocumented and not-very-bash-compatible shell</Text>
					<Text>💾 container only exposes the mounted filesystem (ex. `~/workspace`) to the host</Text>
				</Box>
			</Box>
		</Scroller>
	);
}
