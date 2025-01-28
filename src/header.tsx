import {Config} from '@parrot-app/core';
import {Text} from 'ink';
import React from 'react';

type HeaderProps = {
	config: Config;
};

export default function Header({config}: HeaderProps) {
	return (
		<Text>
			ParrotJS 🦜 - {config.host}
			{config.httpsPort ? '[s]:' + config.httpsPort : ''} {'=>'}{' '}
			{config.baseUrl}
		</Text>
	);
}
