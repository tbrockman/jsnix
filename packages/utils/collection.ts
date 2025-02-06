export const chooseRandom = <T>(collection: T[]): T | undefined => {
	if (collection.length === 0) {
		return undefined;
	}
	const randomIndex = Math.floor(Math.random() * collection.length);
	return collection[randomIndex];
};
