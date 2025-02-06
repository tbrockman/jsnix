import { useEffect, useState } from 'react';
import { useStore } from './useStore.js';
import { readCommands } from '@jsnix/pastel';

export default function useCommands() {
	const [isPending, setIsPending] = useState(false);
	const commands = useStore((state) => state.commands);
	const setCommands = useStore((state) => state.setCommands);

	const fetchCommands = async () => {
		setIsPending(true);
		const path = new URL('../../cli/commands', import.meta.url).pathname;
		const commands = await readCommands(path);
		const result = Array.from(commands, ([, val]) => (val));
		setCommands(result);
		setIsPending(false);
	};

	useEffect(() => {
		fetchCommands();
	}, []);

	return { commands, isPending, setCommands };
}
