import {Config} from '@parrot-app/core';
import {Text} from 'ink';
import React, {useMemo} from 'react';

type FooterProps = {
	config: Config;
};

export default function Footer({config}: FooterProps) {
	const interceptText = useMemo(() => {
		return config.bypassCache ? 'i: [I] Proxy' : 'i: [I] Intercept';
	}, [config.bypassCache]);
	return (
		<Text>
			q: [Q]uit | {interceptText} | o: [O]verride | c: [C]lean orphans
		</Text>
	);
}
