import { useEffect, useState } from 'react';
import { BootOptions } from '@webcontainer/api';
import { Fs, JsnixWebContainer, type FsOrFsFunction } from '@jsnix/utils/container';
import { dots, Spinner } from '@jsnix/utils/spinner';
import chalk from 'chalk';
chalk.level = 3;

export type UseWebContainerProps = {
	fs: FsOrFsFunction;
	stream?: WritableStream;
	autoInit?: boolean;
	mountPoint?: string;
	bootOptions?: BootOptions;
	onTeardown?: () => void;
};

let singleton: JsnixWebContainer | null = null;

export default function useWebContainer({
	fs,
	mountPoint = '/',
	bootOptions = { workdirName: 'workspace' },
	onTeardown,
}: UseWebContainerProps) {
	const [container, setContainer] = useState(singleton);

	const init = async (spinner?: Spinner): Promise<JsnixWebContainer> => {
		if (!singleton) {
			let child = spinner?.addChild({
				text: 'booting webcontainer',
				...dots,
			});
			child?.start();
			singleton = await JsnixWebContainer.boot(bootOptions);
			await child?.stop(chalk.green('✔') + ' webcontainer booted');

			child = spinner?.addChild({
				text: 'retrieving filesystem',
				...dots,
			});
			child?.start();
			fs = ((typeof fs === 'function') ? await fs() : fs) as Fs
			await child?.stop(chalk.green('✔') + ' filesystem retrieved');

			child = spinner?.addChild({
				text: 'mounting filesystem',
				...dots,
			});
			child?.start();
			await singleton.mount(fs, { mountPoint });
			await child?.stop(chalk.green('✔') + ' filesystem mounted');

			setContainer(singleton);
		}
		return singleton;
	};

	const teardown = async () => {
		if (singleton) {
			singleton.teardown();
			singleton = null;
			onTeardown && onTeardown();
			setContainer(singleton);
		}
	};

	useEffect(() => {
		return () => {
			teardown();
		};
	}, []);

	return { init, container: container, setWebContainer: setContainer };
}
