import * as Parrot from '@parrot-app/core';
import {Box, Text, useInput} from 'ink';
import React, {useState} from 'react';
import Footer from './footer.js';
import Header from './header.js';

export default function App() {
	const server = new Parrot.ParrotServer();
	const [serverEvents, setServerEvents] = useState<
		Array<{
			id: string;
			title: string;
		}>
	>([]);
	useInput(input => {
		if (input === 'q') {
			setServerEvents([
				...serverEvents,
				{
					id: new Date(Date.now()).toISOString(),
					title: 'Stopping the server!',
				},
			]);
			server.server?.close();
		}
	});
	server.on(Parrot.ParrotServerEventsEnum.LOG_INFO, (text: string) => {
		setServerEvents([
			...serverEvents,
			{
				id: new Date(Date.now()).toISOString(),
				title: text,
			},
		]);
	});
	server.on(Parrot.ParrotServerEventsEnum.SERVER_STOP, () => {
		setServerEvents([
			...serverEvents,
			{
				id: new Date(Date.now()).toISOString(),
				title: 'Server stopping in 2s...',
			},
		]);
		setTimeout(() => {
			process.exit(0);
		}, 2000);
	});
	server.on(Parrot.ParrotServerEventsEnum.LOG_DEBUG, (text: string) => {
		setServerEvents([
			...serverEvents,
			{
				id: new Date(Date.now()).toISOString(),
				title: text,
			},
		]);
	});
	return (
		<Box flexDirection="column" padding={2}>
			<Box>
				<Header config={server.serverConfig}></Header>
			</Box>
			<Box>
				{serverEvents.map(serverEvent => (
					<Box key={serverEvent.id}>
						<Text color="green">{serverEvent.title}</Text>
					</Box>
				))}
			</Box>
			<Box>
				<Footer config={server.serverConfig}></Footer>
			</Box>
		</Box>
	);
}
