import { useEffect } from 'react';
import { useApp, useStdout } from 'ink';
import zod from 'zod';

export const example = ['hi', 'friend'];
export const args = zod.tuple([
	zod.string().describe('who\'s saying hi'),
]);
export const description = '👋 say hi';

type Props = {
	args: zod.infer<typeof args>;
};

export default function Hi({ args }: Props) {
	const { stdout } = useStdout();
	const { exit } = useApp();

	useEffect(() => {
		stdout.write('👋 Hi, ' + args[0] + '!\n');
		exit();
	}, []);

	return null;
}
