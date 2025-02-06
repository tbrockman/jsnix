import baseConfig from '../../eslint.config.js';

export default [
	...baseConfig,
	{
		rules: {
			'react/jsx-uses-react': 'off', // React 17+ JSX Transform
			'react/react-in-jsx-scope': 'off',
		},
	},
	{
		ignores: ['public/*'],
	},
];
