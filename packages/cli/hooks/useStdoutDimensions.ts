import { useEffect, useState } from 'react';
import { useStdout } from 'ink';

export type Dimensions = {
	rows: number;
	cols: number;
};

export default function useStdoutDimensions(): Dimensions {
	const { stdout } = useStdout();
	const [dimensions, setDimensions] = useState<Dimensions>({ cols: stdout.columns, rows: stdout.rows });

	useEffect(() => {
		const handler = () => setDimensions({ cols: stdout.columns, rows: stdout.rows });
		stdout.on('resize', handler);
		return () => {
			stdout.off('resize', handler);
		};
	}, [stdout]);

	return dimensions;
}
