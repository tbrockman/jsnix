import { useEffect } from 'react';
import { writeOsc } from '@jsnix/utils/helpers';

export const description = '🤝 work together';
export const example = ['recruit'];

export default function Recruit() {
	useEffect(() => {
		writeOsc(80088, {});
	}, []);

	return null;
}
