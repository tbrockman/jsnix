import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Link from 'ink-link';
import BigText from 'ink-big-text';
import SelectInput from 'ink-select-input';
import useCommands from '@jsnix/cli/hooks/useCommands';
import type { Command as PastelCommand } from '@jsnix/pastel';
import Pastel from '@jsnix/pastel';

export type HomeProps = {
	app: Pastel;
};

export const description = '🏠 cli home';
export const isDefault = true;

export default function Home({ app }: HomeProps) {
	const [command, setCommand] = useState<PastelCommand | null>(null);

	useEffect(() => {
		if (command) {
			// @ts-expect-error
			const { example } = command;
			if (example) {
				app.run([...process.argv.slice(0, 2), ...example]);
			}
			else {
				app.run([...process.argv.slice(0, 2), command.name, '--help']);
			}
		}
	}, [command]);

	if (command) {
		return null;
	}

	return (
		<Box flexDirection="column" paddingLeft={2} paddingRight={2} borderStyle="single" borderColor="greenBright">
			<Header onCommandSelected={setCommand} />
		</Box>
	);
}

export type HeaderProps = {
	onCommandSelected: (command: any) => void;
};

const Header = ({ onCommandSelected }: HeaderProps) => {
	return (
		<Box flexWrap="wrap" gap={2} justifyContent="flex-start">
			<Box flexDirection="column" alignItems="center" justifyContent="center">
				<Box alignItems="center">
					<Box alignItems="center">
						{/* @ts-expect-error */}
						<BigText text="js" letterSpacing={1} lineHeight={1} colors={['yellow', '#f80']} spaceless={true}></BigText>
					</Box>
					<Box>
						{/* @ts-expect-error */}
						<BigText text="nix" letterSpacing={1} lineHeight={1} colors={['#93b9f5', '#4287f5']} spaceless={true}></BigText>
					</Box>
				</Box>
				<Box alignSelf="flex-end">
					<Box flexDirection="column">
						<Box alignSelf="flex-end">
							<Text>
								by
								{' '}
								<Link url="https://github.com/tbrockman" fallback={false}>@tbrockman</Link>
							</Text>
						</Box>
						<Text>
							built on
							{' '}
							<Link url="https://webcontainers.io/guides/introduction" fallback={false}>WebContainers</Link>
						</Text>
					</Box>
				</Box>
			</Box>
			<Box flexGrow={1} flexDirection="column" alignItems="flex-start" gap={1} flexWrap="wrap">
				{/* TODO: move */}
				<Commands onCommandSelected={onCommandSelected} />
			</Box>
		</Box>
	);
};

// TODO: command type instead of T
export type Item<T> = {
	label: string;
	value: T;
	raw?: any;
};

const Command = ({ label, raw, isHighlighted }: any) => {
	const hint = raw?.description?.split('\n')[0] || '';

	return (
		<Box flexWrap="wrap" columnGap={1}>
			<Text color={isHighlighted ? 'blue' : ''} inverse={isHighlighted}>{label}</Text>
			<Text color={isHighlighted ? '#93b9f5' : ''} wrap="wrap">
				{/* Render hint as empty characters, so as to not wrap unexpectedly once highlighted */}
				{isHighlighted ? hint : ' '.repeat(hint.length)}
			</Text>
		</Box>
	);
};

export type CommandsProps = {
	onCommandSelected: (command: any) => void;
};

const Commands = ({ onCommandSelected }: CommandsProps) => {
	const { commands } = useCommands();
	const items = commands.map((command) => ({ label: command.name, value: command.name, raw: command })).filter((c) => c.label !== 'home');

	const handleSelect = (item: Item<any>) => {
		const command = items.find((c) => c.label === item.label);
		if (command) {
			onCommandSelected(command.raw);
		}
	};

	return (
		<Box flexDirection="column">
			<Text>Available commands:</Text>
			<SelectInput
				items={items}
				onSelect={handleSelect}
				// @ts-expect-error
				itemComponent={({ label, raw, isSelected }) => <Command label={label} raw={raw} isHighlighted={isSelected} />}
			/>
		</Box>
	);
};
