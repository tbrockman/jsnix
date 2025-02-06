import { Command } from '@jsnix/pastel';
import { create } from 'zustand';

type State = {
	commands: Command[];
	setCommands: (commands: Command[]) => void;
};

export const useStore = create<State>((set) => ({
	commands: [],
	setCommands: (commands: Command[]) => set({ commands }),
}));
