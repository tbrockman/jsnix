import React, { useState } from 'react';
import TextInput from 'ink-text-input';
import { Box, Text } from 'ink';
import { ZodString } from 'zod';

export type StringInputProps = {
	string: ZodString;
};

export const StringInput = ({ string }: StringInputProps) => {
	const [value, setValue] = useState<string>('');

	return (
		<Box>
			<Box flexDirection="column">
				{string.description && (
					<Text>
						{string.description}
						:
					</Text>
				)}
			</Box>
			<TextInput value={value} onChange={setValue} />
		</Box>
	);
};
