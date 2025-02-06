import { OscData } from '@jsnix/utils/types';

export const bin = ['recruit'];
export const osc: OscData = {
	id: 80088,
	handler: async () => {
		window.location.href = 'https://app.reclaim.ai/m/iamtheo/flexible-quick-meeting';
		return true;
	},
};
