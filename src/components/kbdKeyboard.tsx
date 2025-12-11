"use client";

import { Kbd } from "./ui/kbd";

/**
 * delimited by '_'
 */
type Props = {
	keystrokes: string;
};

export function KbdKeyboard(props: Props) {
	return (
		<div className="flex flex-row gap-1 items-center">
			{props.keystrokes.split("_").map((key, index) => (
				<Kbd key={index}>{key}</Kbd>
			))}
		</div>
	);
}
